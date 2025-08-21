# WordPress Plugin Directory Search Filters Chrome Extension

A Chrome extension that enhances the WordPress.org Plugin Directory with advanced filtering capabilities.

## Features

- **Rating Filter**: Filter plugins by minimum star rating (0-5 stars)
- **Installation Count Filter**: Filter by minimum active installations (1K+, 10K+, 100K+, 1M+)
- **Last Updated Filter**: Filter by maximum time since last update (1 month, 3 months, 6 months, 1 year)
- **API-Powered**: Uses WordPress.org Plugin API for accurate, real-time data
- **Responsive Design**: Matches WordPress.org's native styling and layout
- **Sort by Recent**: Results automatically sorted by most recently updated

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Navigate to any WordPress.org plugin directory page to use the filters

## Usage

1. Visit any WordPress.org plugin directory page (e.g., https://wordpress.org/plugins/)
2. Use the filter controls that appear at the top of the plugin listings
3. Set your desired minimum rating, installation count, and last updated timeframe
4. Click "Apply Filters" to see filtered results
5. Click "Clear Filters" to return to the original WordPress.org view

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **API**: WordPress.org Plugins API v1.2
- **Permissions**: `activeTab` and host permissions for wordpress.org
- **Architecture**: Content script injection with CSS styling
- **Browser Support**: Chrome (Manifest V3 compatible)

## Author

**Terry Arthur**  
Email: terryarthur@gmail.com

## License

MIT License - Feel free to use, modify, and distribute.