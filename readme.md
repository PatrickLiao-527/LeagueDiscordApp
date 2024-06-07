# League Discord Bot

A Discord bot to manage League of Legends player registrations, create balanced teams, and play sound effects in voice channels.

## Features

- Register summoner information with preferred lane and summoner name.
- List all registered summoners.
- Create balanced teams based on rank, mastery levels, and recent win rates.
- Play a sound effect when a match is successfully created.
- React with certain emojis to trigger bot responses.

## Commands

- `!register` - Register your summoner information.
- `!remove` - Remove your summoner information.
- `!members` - List all registered summoners.
- `!match` - Start the team selection process.
- React with certain emojis to join the match or trigger other responses.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/league-discord-bot.git
    cd league-discord-bot
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your bot token and Riot API key:
    ```env
    ```

4. Ensure MongoDB is running and accessible at `mongodb://localhost:27017/summoners`.

5. Run the bot:
    ```bash
    node index.js
    ```

## Configuration

- Make sure to replace the placeholders in the code with your actual Discord bot token, Riot API key, and any other necessary information.
- Adjust the sound file path if necessary.

## Dependencies

- `discord.js` - Discord API library.
- `axios` - Promise-based HTTP client for the browser and Node.js.
- `mongoose` - MongoDB object modeling tool designed to work in an asynchronous environment.
- `@discordjs/voice` - Voice API for discord.js.

## Contributing

Feel free to fork this repository and contribute by submitting a pull request. Contributions are welcome!

## License

This project is licensed under the MIT License.
