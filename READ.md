# Locate AI

A cutting-edge geolocation application that uses artificial intelligence to analyze and identify locations from images and videos.

## 🚀 Project Overview

Locate AI is a powerful tool that leverages the latest in computer vision and artificial intelligence to identify geographic locations from visual content. The application provides a modern, cyberpunk-inspired interface that makes it easy to upload media and visualize the results on an interactive 3D globe.

## 👨‍💻 Contributors

- **Itzik Ulano** - Frontend Development
  - Designed and implemented the entire user interface
  - Built the interactive 3D globe visualization using Cesium
  - Created a responsive, modern UI with cyberpunk aesthetics
  - Implemented real-time analysis feedback and animations

- **Yehuda Boas** - Backend Development
  - Developed the AI analysis engine
  - Built the image/video processing pipeline
  - Integrated with OpenAI and other services for location recognition
  - Designed the API endpoints for frontend-backend communication

## ✨ Features

- **Media Analysis**: Upload images or videos for automatic location identification
- **3D Globe Visualization**: View identified locations on an interactive 3D globe
- **Detailed Analysis**: See confidence levels, reasoning, and alternative location suggestions
- **Modern UI**: Enjoy a sleek, cyberpunk-inspired interface with animations and visual feedback
- **Real-time Progress**: Watch the analysis progress with a percentage counter

## 🛠️ Technologies Used

### Frontend
- React.js
- Cesium for 3D globe visualization
- CSS animations and transitions
- Font Awesome icons
- Vite for fast development and building

### Backend
- Python
- Flask for API endpoints
- OpenAI integration for AI analysis
- Scrapingdog API for additional data
- Image and video processing libraries

## 📋 Installation and Setup

### Prerequisites
- Node.js (v14+)
- Python 3.8+
- OpenAI API key
- Scrapingdog API key

### Frontend Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/itzik-u/ai-locate.git
   cd ai-locate/Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd ../Backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file with your API keys:
   ```
   OPENAI=your_openai_api_key_here
   SCRAPINGDOG=your_scrapingdog_api_key_here
   ```

5. Start the backend server:
   ```bash
   python server.py
   ```

## 🔍 How to Use

1. Open the application in your browser (default: http://localhost:5173)
2. Click the upload button to select an image or video file
3. Click the analyze button to start the AI analysis
4. Watch as the globe zooms to the identified location and places a marker
5. Click the details button to see in-depth analysis and reasoning
6. Explore alternative location suggestions and confidence levels

## 🌟 Future Improvements

- Multi-image batch processing
- User accounts and history
- Enhanced AI accuracy with custom training
- Mobile application development
- Integration with more data sources

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed with ❤️ by Itzik Ulano and Yehuda Boas
