const express = require('express');
const app = express();
const { spawn } = require('child_process');
const bodyParser = require('body-parser');

// Increase payload size limit to 50MB
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.set('view engine', 'ejs');

// Serve static files (if needed)
app.use(express.static('public'));

// Render index page
app.get('/', (req, res) => {
    res.render('index');
});

// Handle image compression
app.post('/compress', (req, res) => {
    // Extract base64 encoded image data from request body
    const base64Image = req.body.image;
    const size = req.body.size;
    // Spawn Python script to compress the image
    const pythonProcess = spawn('python', ['compress_image.py',size]);

    let output = '';
    let errorOutput = '';

    // Capture stdout data
    pythonProcess.stdout.on('data', (data) => {
        output += data;
    });

    // Capture stderr data
    pythonProcess.stderr.on('data', (data) => {
        errorOutput += data;
    });

    // Handle process exit
    pythonProcess.on('close', (code) => {
        if (code === 0) {
            try {
                const result = JSON.parse(output);
                if (result.error) {
                    console.error(`Compression failed: ${result.error}`);
                    res.status(500).json({ error: 'Compression failed' });
                } else {
                    // Send the compressed image data as a response
                    res.status(200).json({ image: result.image });
                }
            } catch (err) {
                console.error('Error parsing JSON:', err);
                res.status(500).json({ error: 'Internal server error' });
            }
        } else {
            console.error(`Python script exited with code ${code}`);
            console.error(`Error from Python script: ${errorOutput}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Handle process error
    pythonProcess.on('error', (error) => {
        console.error(`Error spawning Python script: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    });

    // Pass base64 image data as bytes through stdin
    pythonProcess.stdin.write(Buffer.from(base64Image, 'base64'));
    pythonProcess.stdin.end();
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
