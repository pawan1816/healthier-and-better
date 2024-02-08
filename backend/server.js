const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors())

// Connect to MongoDB (update the connection string)
mongoose
	.connect('mongodb://localhost:27017/healthtracker',
		{
			useNewUrlParser: true,
			useUnifiedTopology: true
		})
	.then(
		() => {
			console.log('MongoDB connected successfully!');
		})
	.catch((error) => {
		console.error('Error connecting to MongoDB:', error);
	});

//--------------------------------//
// Define MongoDB schema and model
//--------------------------------//
const healthDataSchema =
	new mongoose.Schema(
		{
			date: { type: Date, default: Date.now },
			steps: Number,
			caloriesBurned: Number,
			distanceCovered: Number,
			weight: Number,

		});

const HealthData =
	mongoose.model('HealthData', healthDataSchema);

//----------------------------//
// Seeding some initial data 
//----------------------------//

const seedData = async () => {
	try {
		// Check if data already exists
		const existingData =
			await HealthData.find();
		if (existingData.length === 0) {
			const initialData = [
				{
					date: new Date('2022-01-01'),
					steps: 5000,
					caloriesBurned: 200,
					distanceCovered: 2.5,
					weight: 70,
				},
				{
					date: new Date('2022-01-02'),
					steps: 8000,
					caloriesBurned: 300,
					distanceCovered: 3.2,
					weight: 69,
				},
				// Add more initial data as needed
			];

			await HealthData.insertMany(initialData);
			console.log('Data seeded successfully.');
		} else {
			console.log('Data already exists. Skipping seed.');
		}
	} catch (error) {
		console.error('Error seeding data:', error.message);
	}
};

seedData();

//----------------------------//
// Routes
//----------------------------//

// Get all tracks
app.get('/tracks',
	async (req, res) => {
		try {
			const allTracks = await HealthData.find();
			res.json(allTracks);
		} catch (error) {
			console.error('Error fetching tracks:', error);
			res.status(500)
				.json(
					{
						error: 'Internal Server Error'
					});
		}
	});

// Get tracks for a particular day
app.get('/tracks/:date', async (req, res) => {
	const requestedDate = new Date(req.params.date);
	try {
		const tracksForDay =
			await HealthData.find(
				{
					date: {
						$gte: requestedDate,
						$lt: new Date(
							requestedDate.getTime()
							+ 24 * 60 * 60 * 1000)
					}
				});
		res.json(tracksForDay);
	} catch (error) {
		res.status(500)
			.json({ error: 'Internal Server Error' });
	}
});

// Update values for a particular day
app.put('/tracks/:date',
	async (req, res) => {

		const requestedDate =
			new Date(req.params.date);
		try {
			const existingTrack =
				await HealthData.findOne(
					{
						date:
						{
							$gte: requestedDate,
							$lt: new Date(
								requestedDate.getTime()
								+ 24 * 60 * 60 * 1000
							)
						}
					});
			console.log('existing track', existingTrack);

			if (existingTrack) {
				// Update existing track
				Object.assign(existingTrack, req.body);
				await existingTrack.save();
				res.json(existingTrack);
			} else {
				// Create new track for the day if it doesn't exist
				const newTrack =
					new HealthData(
						{
							date: requestedDate,
							...req.body
						});
				await newTrack.save();
				console.log(newTrack);
				res.status(200).json(newTrack);
			}
		} catch (error) {
			res.status(500)
				.json(
					{
						error: 'Internal Server Error'
					});
		}
	});

app.listen(PORT,
	() => {
		console.log(
			`Server is running on port ${PORT}`
		);
	});
