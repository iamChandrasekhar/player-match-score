const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const dbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost/3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
dbAndServer();

const player_details_table = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const match_details_table = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayers = `
    SELECT * FROM player_details;
    `;
  const playersArray = await database.all(getPlayers);
  response.send(
    playersArray.map((eachPlayer) => player_details_table(eachPlayer))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerWithId = `
    SELECT * FROM player_details WHERE player_id = ${playerId};
    `;
  const player = await database.get(getPlayerWithId);
  response.send(player);
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.params;
  const updatePlayersDetails = `
    UPDATE player_details SET 
    player_name = '${playerName}' WHERE player_id = ${playerId};
    `;
  await database.run(updatePlayersDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const match_details = await database.get(getMatchDetails);
  response.send(match_details);
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerPlayedMatches = `
    SELECT * FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};
    `;
  const playerPlayedMatches = await database.all(getPlayerPlayedMatches);
  response.send(
    playerPlayedMatches.map((eachMatch) => match_details_table(eachMatch))
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerPlayedMatches = `
    SELECT
	      player_details.player_id AS playerId,
	      player_details.player_name AS playerName
	    FROM player_match_score NATURAL JOIN player_details
        WHERE match_id=${matchId};`;
  const playerPlayedMatches = await database.all(getPlayerPlayedMatches);
  response.send(playerPlayedMatches);
});

module.exports = app;
