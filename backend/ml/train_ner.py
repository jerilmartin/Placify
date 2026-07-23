import spacy
from spacy.training.example import Example
import random
import os
import argparse
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def train_custom_ner(training_data_path: str, output_dir: str, epochs: int = 10):
    logger.info(f"Loading training data from {training_data_path}")
    
    if not os.path.exists(training_data_path):
        logger.error(f"Training data not found at {training_data_path}")
        return

    # Load dataset
    nlp = spacy.blank("en")
    doc_bin = spacy.tokens.DocBin().from_disk(training_data_path)
    docs = list(doc_bin.get_docs(nlp.vocab))
    
    if not docs:
        logger.error("No documents found in training data.")
        return

    logger.info(f"Loaded {len(docs)} training examples.")

    # Convert to Examples for spaCy v3
    examples = []
    for doc in docs:
        examples.append(Example.from_dict(nlp.make_doc(doc.text), {"entities": [(ent.start_char, ent.end_char, ent.label_) for ent in doc.ents]}))

    # Add NER to pipeline if it doesn't exist
    if "ner" not in nlp.pipe_names:
        ner = nlp.add_pipe("ner", last=True)
    else:
        ner = nlp.get_pipe("ner")

    # Add labels to the NER pipe
    labels = set()
    for eg in examples:
        for ent in eg.reference.ents:
            labels.add(ent.label_)
            
    for label in labels:
        ner.add_label(label)
        logger.info(f"Added label: {label}")

    # Disable other pipes during training to avoid messing them up
    other_pipes = [pipe for pipe in nlp.pipe_names if pipe != "ner"]
    with nlp.disable_pipes(*other_pipes):
        optimizer = nlp.begin_training()
        
        logger.info(f"Starting training for {epochs} epochs...")
        for itn in range(epochs):
            random.shuffle(examples)
            losses = {}
            
            # Batching could be added here for speed, but this is a simple implementation
            for batch in spacy.util.minibatch(examples, size=8):
                nlp.update(
                    batch,
                    drop=0.3,
                    sgd=optimizer,
                    losses=losses
                )
            logger.info(f"Epoch {itn + 1}/{epochs} - Losses: {losses}")

    # Save the model
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    nlp.to_disk(output_dir)
    logger.info(f"Training complete! Model saved to {output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="train.spacy", help="Path to .spacy training data")
    parser.add_argument("--output", type=str, default="custom_ner_model", help="Directory to save the trained model")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    args = parser.parse_args()
    
    train_custom_ner(args.data, args.output, args.epochs)
