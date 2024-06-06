# Seivi
## Introduction
Seivi 2.0 is a Node.js project designed to keep track of items and their prices. The project utilizes
various packages such as Express for server-side functionality, Sequelize for ORM, and many
others to provide a robust backend solution.
## Installation
1. Clone the repository:
 ```
 git clone https://github.com/DavinciPG/seivi.git
 ```
2. Navigate to the project directory:
 ```
 cd seivi_2.0
 ```
3. Install the dependencies:
 ```
 npm install
 ```
4. Setting up .env. Fill .env with corresponding values
```
 copy .env.sample .env
```
5. Installing the driver (only required if you are using a webhost like ZONE.ee).
```
 wget https://commondatastorage.googleapis.com/chromium-browser-snapshots/Linux_x64/901912/chrome-linux.zip
 unzip chrome-linux.zip
 chmod +x chrome-linux/chrome
```
6. Move the driver to root/drivers
7. Uncomment BrowserController.js executablePath
## How to Run
To start the server, run the following command:
```
npm start
```
The server will start, and you can access it at `http://localhost:[port]`.
## Scripts
- `start`: Runs the main server file (`src/server.js`).
## License
This project is licensed under the ISC License.
## Bugs and Issues
If you encounter any issues, please report them [here](https://github.com/DavinciPG/seivi/issues).
## Contributing
We welcome contributions! Please fork the repository and submit pull requests.
## Credits
- **Project Owner**: DavinciPG
- **Contributors**: Margus Treumuth