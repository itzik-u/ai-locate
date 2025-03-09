import React, { useEffect, useState, useRef } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import axios from "axios";
import "./SpyDashboard.css";

export default function SpyDashboard() {
  const [viewer, setViewer] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState(null); // Determines if it's an image or video
  const [showDetails, setShowDetails] = useState(false); // Controls whether to show detailed dashboard
  const [selectedEntity, setSelectedEntity] = useState(null); // Tracks the clicked entity
  const markerRef = useRef(null); // Ref to store the current marker entity
  const cesiumContainer = useRef(null); // Ref to store the Cesium container
  const [fileUploaded, setFileUploaded] = useState(false); // Track if file is uploaded
  const [analysisComplete, setAnalysisComplete] = useState(false); // Track if analysis is complete
  const [activeButton, setActiveButton] = useState('upload'); // Track which button should be clicked next
  const [analysisPercent, setAnalysisPercent] = useState(0); // Track analysis percentage

  useEffect(() => {
    let cesiumViewer;

    const initializeCesium = async () => {
      Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;
      cesiumViewer = new Cesium.Viewer("cesiumContainer", {
        terrainProvider: await Cesium.createWorldTerrainAsync(),
        baseLayerPicker: false,
        animation: false,
        timeline: false,
        infoBox: false, // Disable default infobox
        selectionIndicator: false,
      });

      // Setup event handler for clicking entities
      cesiumViewer.screenSpaceEventHandler.setInputAction((click) => {
        const pickedObject = cesiumViewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject) && pickedObject.id) {
          // A marker was clicked
          setSelectedEntity(pickedObject.id);
          setShowDetails(true);
        } else {
          // Clicked on empty space - hide details
          setShowDetails(false);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      setViewer(cesiumViewer);
    };

    initializeCesium();

    return () => {
      if (cesiumViewer) {
        cesiumViewer.destroy();
      }
    };
  }, []);

  // Effect to create and zoom to marker when analysis result changes
  useEffect(() => {
    if (viewer && analysisResult) {
      addMarkerAndZoomTo(analysisResult);
    }
  }, [viewer, analysisResult]);

  // Helper function to convert location name to coordinates
  const getCoordinatesFromLocationName = async (locationName) => {
    // Don't geocode if no location name is provided
    if (!locationName || locationName === "Unknown Location") {
      console.warn("No location name provided for geocoding");
      return null;
    }

    try {
      console.log(`Attempting to geocode: ${locationName}`);

      // Try Nominatim API first (OpenStreetMap)
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}`;
      const response = await axios.get(nominatimUrl);

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        };
      }

      console.warn(`Location not found: ${locationName}`);
      return null;
    } catch (error) {
      console.error("Error geocoding location:", error);
      return null;
    }
  };

  const handleLogin = () => {
    setTimeout(() => {
      setShowLogin(false);
    }, 2000);
  };

  // 📤 **Handle File Selection (Image or Video)**
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }

    console.log("File selected:", file);

    // Reset states for new file
    setSelectedFile(file);
    setFileUploaded(true);
    setAnalysisComplete(false);
    setAnalysisResult(null);
    setShowDetails(false);

    // Set file type based on MIME type
    if (file.type.includes('image')) {
      setFileType('image');
      console.log("File type set to image");
    } else if (file.type.includes('video')) {
      setFileType('video');
      console.log("File type set to video");
    } else {
      console.warn("Unsupported file type:", file.type);
      alert("Please select an image or video file.");
      setSelectedFile(null);
      setFileUploaded(false);
      return;
    }

    // Guide user to next step
    setActiveButton('analyze');
  };

  // 📤 **Upload Image or Video & Send to Backend**
  const handleFileUpload = async () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    if (!fileType) {
      console.error("File type not determined");
      alert("Cannot determine file type. Please try uploading again.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisPercent(0);

    // Move the active button animation to the analyzing button
    setActiveButton('analyze');

    // Create a percentage animation for analysis
    const interval = setInterval(() => {
      setAnalysisPercent(prevPercent => {
        const newPercent = prevPercent + 1;
        return newPercent <= 99 ? newPercent : 99; // Cap at 99% until real completion
      });
    }, 50);

    try {
      // First upload the file to get a URL
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "Aa123456"); // Required for unsigned uploads

      // Upload to Cloudinary or your preferred file storage service
      const cloudinaryURL = "https://api.cloudinary.com/v1_1/dbs8wrvlv/";

      let fileUrl;

      console.log(`Uploading ${fileType} to Cloudinary...`);

      try {
        const cloudResponse = await axios.post(
          `${cloudinaryURL}${fileType}/upload`,
          formData
        );
        fileUrl = cloudResponse.data.secure_url;
        console.log(`File uploaded successfully. URL: ${fileUrl}`);
      } catch (cloudError) {
        console.error("Cloudinary upload error:", cloudError);
        throw new Error(`Failed to upload file to Cloudinary: ${cloudError.message}`);
      }

      // Now send the URL to the backend with appropriate content type
      let backendResponse;

      console.log(`Sending ${fileType} URL to backend for analysis...`);

      try {
        const endpoint = fileType === "image" ? "analyze" : "analyze_video";
        const payload = fileType === "image" ? { image_url: fileUrl } : { video_url: fileUrl };

        backendResponse = await axios.post(
          `http://localhost:5001/${endpoint}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        console.log("Backend response received:", backendResponse.data);
      } catch (backendError) {
        console.error("Backend error:", backendError);
        console.error("Backend error response:", backendError.response?.data);
        throw new Error(`Backend analysis failed: ${backendError.message}`);
      }

      // Set the final percentage to 100%
      setAnalysisPercent(100);
      // Clear the percentage interval
      clearInterval(interval);

      // Process the real response data from backend
      handleBackendResponse(backendResponse.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Error: ${error.message || "Unknown error occurred"}`);
      setIsAnalyzing(false);
      setActiveButton('analyze'); // Reset to analyze button for retry
      clearInterval(interval);
    }
  };

  // 🔍 **Handle Backend Response**
  const handleBackendResponse = async (data) => {
    setIsAnalyzing(false);
    setAnalysisComplete(true);

    // Move active button indication to details
    setActiveButton('details');

    console.log("Backend Response:", data);

    if (!data || data.status !== "success") {
      console.error("Invalid or error response from backend:", data);
      alert("Backend analysis failed. Please try again.");
      return;
    }

    // Process and save analysis result directly from backend
    setAnalysisResult(data);

    // The backend doesn't provide coordinates directly, but gives a location name
    // We need to geocode the location to get coordinates
    if (data.top_location) {
      try {
        console.log(`Geocoding location: ${data.top_location}`);
        // Get coordinates for the location name
        const coordinates = await getCoordinatesFromLocationName(data.top_location);

        if (coordinates) {
          console.log(`Coordinates found: ${JSON.stringify(coordinates)}`);

          // Create a result object with the necessary data
          const result = {
            location: data.top_location,
            coordinates: coordinates
          };

          // Add marker to the map
          addMarkerAndZoomTo(result);
        } else {
          console.warn(`Could not geocode the location: ${data.top_location}`);
        }
      } catch (error) {
        console.error("Error geocoding location:", error);
      }
    } else {
      console.warn("No location provided in the backend response");
    }
  };

  // Function to add marker and zoom to location
  const addMarkerAndZoomTo = (result) => {
    if (!viewer) {
      console.error("Cesium viewer not initialized. Cannot add marker.");
      return;
    }

    if (!result || !result.coordinates) {
      console.warn("Cannot add marker: Missing coordinates");
      return;
    }

    console.log(`Adding marker for location: ${result.location} at coordinates:`, result.coordinates);

    // Remove existing marker if it exists
    if (markerRef.current) {
      viewer.entities.remove(markerRef.current);
    }

    // Create marker at the specified coordinates
    const position = Cesium.Cartesian3.fromDegrees(
      result.coordinates.longitude,
      result.coordinates.latitude
    );

    // Add a more visible pin marker with label
    markerRef.current = viewer.entities.add({
      position: position,
      billboard: {
        image: "/marker-icon.svg", // Use the existing SVG marker icon
        scale: 1.5, // Larger scale for better visibility from above
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // Ensure marker is always visible
      },
      label: {
        text: result.location || "Unknown Location",
        font: "16px sans-serif", // Slightly larger font
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -60), // Move label higher above the pin
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // Ensure label is always visible
      },
    });

    // Fly camera to the marker position from directly above (top-down view)
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        result.coordinates.longitude,
        result.coordinates.latitude,
        30000 // Height in meters
      ),
      orientation: {
        heading: Cesium.Math.toRadians(0), // North aligned
        pitch: Cesium.Math.toRadians(-90), // Looking straight down
        roll: 0.0,
      },
      duration: 2.0,
    });
  };

  // Modify the details button click handler to stop animations
  const toggleDetails = () => {
    setShowDetails(!showDetails);
    // Stop the active button animation when details are shown
    if (!showDetails) {
      setActiveButton('none');
    } else {
      setActiveButton('details');
    }
  };

  // Check if we should render details panel
  const renderDetailsPanel = selectedEntity && showDetails && analysisResult;

  return (
    <div className="spy-dashboard">
      {/* Removed login overlay to go straight to main page */}
      <div className="hud-controls">
        <div className="file-upload-container">
          <input
            type="file"
            id="file-input"
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden-file-input"
          />

          <div className="modern-controls">
            <label
              htmlFor="file-input"
              className={`icon-button upload-button ${fileUploaded ? 'file-selected' : ''} ${activeButton === 'upload' ? 'active-next' : ''}`}
              title={fileUploaded ? "File Selected" : "Upload Image or Video"}
            >
              {fileUploaded ? (
                <i className="fas fa-check"></i>
              ) : (
                <i className="fas fa-location-arrow"></i>
              )}
            </label>

            <div className="filename-container">
              <span className="selected-filename">
                {selectedFile ? selectedFile.name : "No file selected"}
              </span>
            </div>

            <button
              className={`icon-button analyze-button ${isAnalyzing ? 'analyzing' : ''} ${analysisComplete ? 'analyzed' : ''} ${activeButton === 'analyze' ? 'active-next' : ''}`}
              onClick={handleFileUpload}
              disabled={!selectedFile || isAnalyzing}
              title="Analyze File"
            >
              {isAnalyzing ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : analysisComplete ? (
                <i className="fas fa-check"></i>
              ) : (
                <i className="fas fa-user-secret"></i>
              )}
            </button>
          </div>

          {/* Move the details button under the other buttons */}
          {analysisResult && (
            <div className="details-button-container">
              <button
                className={`icon-button details-button ${activeButton === 'details' ? 'active-next' : ''} ${showDetails ? 'active' : ''}`}
                onClick={toggleDetails}
                title={showDetails ? "Hide Details" : "View Details"}
              >
                <i className="fas fa-list-alt"></i>
                <span>Details</span>
              </button>
            </div>
          )}
        </div>

        {/* Move location-badge inside hud-controls */}
        {analysisResult && (
          <div className="location-badge">
            <span>Location: {analysisResult.top_location || "Unknown"}</span>
            <span>Confidence: {analysisResult.confidence || "N/A"}</span>
          </div>
        )}
      </div>

      {/* 🗺️ CESIUM MAP CONTAINER */}
      <div
        id="cesiumContainer"
        className="cesium-container"
        ref={cesiumContainer}
      ></div>

      {/* Moved the analysis animation to the bottom of the page */}
      {isAnalyzing && (
        <div className="bottom-analysis-progress">
          <div className="hologram-loader">
            <div className="loading-ring"></div>
            <div className="analysis-progress">
              <span className="analysis-percent-text">{analysisPercent}%</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${analysisPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Showing the details panel only when showDetails is true */}
      {analysisResult && showDetails && (
        <div className="analysis-details-panel">
          <button
            className="close-details"
            onClick={toggleDetails}
            title="Close Details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" fill="currentColor" className="close-icon">
              <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
            </svg>
          </button>

          <div className="panel-header">
            <h2>Analysis Results</h2>
          </div>

          <div className="panel-content">
            {/* Original Media Section - Display the analyzed image/video */}
            <div className="detail-section media-section">
              <h3>Original {fileType === "image" ? "Image" : "Video"}</h3>
              <div className="media-container">
                {fileType === "image" ? (
                  <img
                    src={analysisResult.image_url || URL.createObjectURL(selectedFile)}
                    alt="Analyzed media"
                    className="analyzed-image"
                  />
                ) : (
                  <video
                    src={analysisResult.video_url || URL.createObjectURL(selectedFile)}
                    controls
                    className="analyzed-video"
                  />
                )}
              </div>
            </div>

            {/* Main result information */}
            <div className="detail-section">
              <h3>Location Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Detected Location:</span>
                  <span className="info-value">{analysisResult.top_location || "Unknown"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Confidence:</span>
                  <span className="info-value">{analysisResult.confidence || "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Reasoning section */}
            {analysisResult.ai_analysis && analysisResult.ai_analysis.reasoning && (
              <div className="detail-section">
                <h3>Analysis Reasoning</h3>
                <div className="reasoning-box">
                  <p>{analysisResult.ai_analysis.reasoning}</p>
                </div>
              </div>
            )}

            {/* Top location guesses */}
            {analysisResult.ai_analysis && analysisResult.ai_analysis.top_location_guesses && analysisResult.ai_analysis.top_location_guesses.length > 0 && (
              <div className="detail-section locations-card">
                <h3>Top Location Guesses</h3>
                <div className="location-list">
                  {analysisResult.ai_analysis.top_location_guesses.map((location, index) => (
                    <div key={index} className="location-item">
                      <span className="location-rank">{index + 1}</span>
                      <span className="location-name">{location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}