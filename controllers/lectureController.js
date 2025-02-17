const { user } = require("../dbConfig");
const Lectures = require("../models/Lectures");
const multer = require("multer");
const path = require('path');
const fs = require('fs'); 
const fetch = require('node-fetch'); // Import node-fetch to make API requests

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(__dirname, '..', 'public', 'lectureVideos'));
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  
  const upload = multer({ storage: storage });
  

// Retrieve and display all lectures
const getAllLectures = async (req, res) => {
    try {
        const getAllLectures = await Lectures.getAllLectures();
        res.json(getAllLectures);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving lectures');
    }
};

const getLectureDetails = async (req, res) => {
    const id = req.params.id;
    try {
        const lectureDetails = await Lectures.getLectureDetails(id);
        if (!lectureDetails) {
            return res.status(404).send('Lecture not found');
        }
        res.json(lectureDetails);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving lecture');
    }
};

// Retrieve a specific lecture by ID
async function getLectureByID(req, res) {
    const lectureID = parseInt(req.params.id, 10);

    if (isNaN(lectureID) || lectureID < 1) {
        console.error('Invalid lectureID:', req.params.id);
        return res.status(400).send('Invalid lecture ID');
    }

    try {
        const lecture = await Lectures.getLectureByID(lectureID);
        if (!lecture) {
            return res.status(404).json({ error: 'Lecture not found' });
        }
        res.json(lecture);
    } catch (error) {
        console.error('Error retrieving lecture:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Delete a specific lecture by ID, ensuring the user has permission
const deleteLecture = async (req, res) => {
    const lectureID = parseInt(req.params.id);
    const userID = req.user.id;
    try {
        const lecture = await Lectures.getLectureByID(lectureID);
        if (!lecture) {
            return res.status(404).json({ message: "Lecture not found" });
        }
        // Check if the user is the creator of the lecture
        if (lecture.userID !== userID) {
            return res.status(403).send({ message: "You do not have permission to delete this lecture teehee" });
        }

        const success = await Lectures.deleteLecture(lectureID);
        if (!success) {
            return res.status(404).json({ message: "Lecture not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting lecture" });
    }
};


// Delete a chapter by its name, ensuring the user has permission
const deletingChapterName = async (req, res) => {
    const { courseID, chapterName } = req.params;
    const { lectureIDs } = req.body;
    const userID = req.user.id;

    if (!Array.isArray(lectureIDs) || lectureIDs.length === 0) {
        return res.status(400).json({ message: "Invalid lecture IDs provided" });
    }

    try {
        // Ensure all lectures belong to the same user
        for (const lectureID of lectureIDs) {
            const lecture = await Lectures.getLectureByID(lectureID);
            if (!lecture) {
                return res.status(404).json({ message: `Lecture with ID ${lectureID} not found` });
            }
            if (lecture.userID !== userID) {
                return res.status(403).json({ message: "You do not have permission to delete this chapter." });
            }
        }

        const success = await Lectures.deletingChapterName(courseID, chapterName, lectureIDs);
        if (!success) {
            return res.status(404).json({ message: "Chapter not found" });
        }
        res.status(200).json({ message: "Chapter successfully deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting chapter" });
    }
};


// Update a lecture's information, ensuring the user has permission
const updateLecture = async (req, res) => {
    console.log('REQUEST BODY:', req.body);
    const userID = req.user.id;
    const id = req.params.id;
    const { title, description, chapterName, duration } = req.body;
    let videoFilename = null;

    // Check for 'lectureVideo' field in the request
    const lectureVideo = req.body.lectureVideo || (req.file && req.file.filename);

    if (lectureVideo) {
        videoFilename = lectureVideo;
    } else {
        // If no new video is uploaded or no Vimeo URL is provided, keep the existing video filename
        const existingLecture = await Lectures.getLectureByID(id);
        if (existingLecture) {
            videoFilename = existingLecture.video;
        }
    }

    const newLectureData = {
        Title: title,
        Description: description,
        ChapterName: chapterName,
        Duration: duration,
        Video: videoFilename
    };

    try {
        const existingLecture = await Lectures.getLectureByID(id);

        if (!existingLecture) {
            return res.status(404).send('Lecture not found!');
        }

        if (userID !== existingLecture.userID) {
            return res.status(403).send('You do not have permission to edit the lecture');
        }

        const updateResult = await Lectures.updateLecture(id, newLectureData);
        res.json({ message: 'Lecture updated successfully', data: updateResult, userID: userID });
    } catch (error) {
        console.error('Error updating lecture:', error);
        res.status(500).send('Error updating lecture');
    }
};


// Retrieve the name of the last chapter for the current user, so user can add multiple lecture under chapter
const getLastChapterName = async (req, res) => {
    const userID = req.user.id;
    try {
        const chapterName = await Lectures.getLastChapterName(userID);
        console.log('Chapter Name:', chapterName); // Debugging log
        if (!chapterName) {
            return res.status(404).send('Chapter name not found');
        }
        res.status(200).json({ chapterName });
    } catch (error) {
        console.error('Error getting chapter name:', error);
        res.status(500).send('Error getting chapter name');
    }
};


// Retrieve the maximum course ID from the database, so we can create new courseID 
const getMaxCourseID = async (req, res) => {
    try {
        const maxCourseID = await Lectures.getMaxCourseID();
        res.status(200).json({ maxCourseID });
    } catch (error) {
        console.error('Error retrieving max CourseID:', error);
        res.status(500).send('Error retrieving max CourseID');
    }
};

// Create a new lecture
const createLecture = async (req, res) => {
    const { title, duration, description, chapterName, courseID } = req.body;
    const userID = req.user.id; // extract userID from jwt 

    if (!userID) {
        console.error("UserID not provided");
        return res.status(400).json({ message: "UserID not provided" });
    }
    if (!courseID) {
        console.error("CourseID not provided");
        return res.status(400).json({ message: "CourseID not provided" });
    }

    console.log('videovimeourl',req.body.vimeoVideoUrl );
    console.log(req.body.vimeoVideoUrl == null);
    if ( !req.files && !req.files.lectureVideo && req.body.vimeoVideoUrl == null ) {
        console.error("Video not provided");
        return res.status(400).json({ message: "Video not provided" });
    }

    // Check if either a local video file or Vimeo URL is provided
    let videoFilename = null;
    let vimeoVideoUrl = req.body.vimeoVideoUrl || null;
    console.log('vimeovideourl:',vimeoVideoUrl);

    // If there are files in the request and a local video is uploaded
    if (req.files && req.files.lectureVideo) {
        videoFilename = req.files.lectureVideo[0].filename;
    }

    // If neither local video nor Vimeo URL is provided, return an error
    if (!videoFilename && !vimeoVideoUrl) {
        console.error("Video not provided");
        return res.status(400).json({ message: "Video not provided" });
    }

    try {
        const position = await Lectures.getCurrentPositionInChapter(chapterName);

        const newLectureData = {
            courseID: parseInt(courseID), // Ensure courseID is an integer
            userID,
            title,
            duration: parseInt(duration), // Ensure duration is an integer
            description,
            position,
            chapterName,
            video: videoFilename || vimeoVideoUrl, // Only the filename / vimeo URL is saved
        };


        const newLectureID = await Lectures.createLecture(newLectureData);
        res.status(201).json({ LectureID: newLectureID, ...newLectureData });
    } catch (error) {
        console.error('Error creating lecture:', error);
        res.status(500).json({ message: 'Error creating lecture', error: error.message });
    }
};


// So the right lecture video will play according to the lecture
const getLectureVideoByID = async (req, res) => {
    const lectureID = parseInt(req.params.lectureID, 10);
    console.log('Parsed lectureID:', lectureID);

    if (isNaN(lectureID) || lectureID < 1) {
        console.error('Invalid lectureID:', req.params.id);
        return res.status(400).send('Invalid lecture ID');
    }

    try {
        const videoFilename = await Lectures.getLectureVideoByID(lectureID);
        if (videoFilename) {
            // Construct the full path to the video file
            const videoPath = path.resolve(__dirname, '..', 'public', 'lectureVideos', videoFilename);

            fs.access(videoPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.error('File does not exist:', videoPath);
                    return res.status(404).send('Video not found');
                }

                res.sendFile(videoPath, (err) => {
                    if (err) {
                        console.error('Error sending video file:', err);
                        res.status(500).send('Error serving video');
                    }
                });
            });
        } else {
            res.status(404).send('Video not found');
        }
    } catch (error) {
        console.error('Error serving video:', error);
        res.status(500).send('Internal server error');
    }
};


// When user press into course the lectures under it will show
const getLecturesByCourseID = async (req, res) => {
    const courseID = parseInt(req.params.courseID);
    console.log(`Received courseID: ${courseID}`);

    if (isNaN(courseID)) {
        console.error('Invalid courseID:', courseID);
        return res.status(400).send('Invalid course ID');
    }

    try {
        console.log(`Fetching lectures for course ID: ${courseID}`);
        const lectures = await Lectures.getLecturesByCourseID(courseID);
        res.json(lectures);
    } catch (error) {
        console.error('Error fetching lectures:', error);
        res.status(500).send('Internal server error');
    }
};

const checkingUserID = async (req, res) => {
    const userID = req.user.id;
    console.log('Current logged-in user ID:', userID);
    res.json({ userID });
};

// VIMEO API 
const accessToken = process.env.VIMEO_ACCESS_TOKEN;
async function searchVimeoVideo(req, res) {
    try {
        const searchQuery = req.query.search || ''; // Get the search query from the request
        const response = await fetch(`https://api.vimeo.com/videos?query=${searchQuery}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json(); // Extract error message
            res.status(response.status).json({ error: errorData.error || 'Error searching for Vimeo video...' });
            return;
        }
        console.log('searching for vimeo video...');
        const data = await response.json();
        res.json({
            message: "Searching for Vimeo video...",
            videos: data
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// function that extracts vimeo video ID
function extractVideoId(url) {
    // Match video ID in URL
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

// getting vimeo video from vimeo API 
async function getVimeoVideo(req, res) {
    const lectureID = parseInt(req.params.id);
    try {
        const lecture = await Lectures.getLectureByID(lectureID);
        console.log(lecture);
        const videoUrl = lecture.video;
        console.log('videor url in getVimeoVideo: ',videoUrl);
        if (!videoUrl) {
            return res.status(400).json({ error: 'Invalid Vimeo URL' });
        }
        // extract video ID because that's what Vimeo API needs
        const videoId = extractVideoId(videoUrl);
        if(!videoId){
            return res.status(400).json({error:"Invalid vimeo URL"});
        }

        // Fetch video details from Vimeo API
        const response = await fetch(`https://api.vimeo.com/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json(); // Extract error message
            console.error('Error from Vimeo API:', errorData);
            return res.status(response.status).json({ error: errorData.error || 'Error fetching Vimeo video details' });
        }

        const data = await response.json();
        res.json({
            message: 'Fetched Vimeo video details successfully',
            video: data
        });

    } catch (error) {
        console.error('Error fetching Vimeo video details:', error);
        res.status(500).json({ error: error.message });
    }
}



module.exports = {
    getAllLectures,
    getLectureDetails,
    updateLecture,
    createLecture,
    deleteLecture,
    deletingChapterName,
    getLastChapterName,
    getLectureVideoByID,
    getLecturesByCourseID,
    getMaxCourseID,
    getLectureByID,
    checkingUserID,
    searchVimeoVideo,
    getVimeoVideo
};
