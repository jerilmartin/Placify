import sys
import os

# Add backend directory to sys path so ml module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml.resume_parser import ResumeParserML

def test_parser():
    parser = ResumeParserML()
    sample_text = """
    John Doe
    johndoe@email.com | +91 9876543210 | https://linkedin.com/in/johndoe | https://github.com/johndoe

    Education
    B.Tech in Computer Science, Example University
    
    Skills
    Experienced in Python, JavaScript, React, and Node.js. 
    Also familiar with Docker and Kubernetes for deployment.

    Experience
    Software Engineer at TechCorp
    """
    
    result = parser.extract_entities(sample_text)
    print("Extraction Result:")
    import json
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    test_parser()
