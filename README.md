# 🎬 Movie Streaming Finder

A sleek web application that helps you find where movies are available for streaming in Germany. The app uses the TMDb API to fetch movie details and streaming provider information.

## Features

- 🔍 Search for any movie by title
- 📺 View available streaming platforms in Germany (Netflix, Amazon Prime, Disney+, etc.)
- 🎞️ See detailed movie information including ratings, plot, and genres
- 🌟 Browse recommended, popular, and new releases
- 📱 Fully responsive design for all device sizes
- ✨ Modern UI with smooth animations

## Setup Instructions

1. **Get a TMDb API Key**:
   - Visit [The Movie Database API](https://www.themoviedb.org/settings/api) and register for an account
   - Request an API key (v3 auth)

2. **Configure the App**:
   - Open `index.js` in your code editor
   - Replace the placeholder API key with your own:
     ```javascript
     const TMDB_API_KEY = 'YOUR_API_KEY';
     ```

3. **Run the App**:
   - Simply open `index.html` in your web browser
   - No server required - works directly from the file system

## How to Use

1. Enter a movie title in the search box
2. View detailed information about the movie
3. See which streaming platforms offer the movie in Germany
4. Browse recommended, popular, and new movies in the sections below

## Technologies Used

- HTML5, CSS3, JavaScript
- TMDb API for movie data
- Vanilla JavaScript (no frameworks)
- Modern CSS features like CSS variables, grid, and flexbox

## Notes

- The app currently only shows streaming availability for Germany
- Some movies might not have streaming data available
- The API has rate limits - avoid excessive requests

## License

This project is open source and available under the MIT License.

Enjoy finding where to stream your favorite movies! 🍿
