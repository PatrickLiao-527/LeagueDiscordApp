const axios = require('axios');

let championIdToName = {};

const fetchChampionData = async () => {
    try {
        const response = await axios.get('https://ddragon.leagueoflegends.com/cdn/11.24.1/data/en_US/champion.json');
        const champions = response.data.data;
        for (const champion in champions) {
            championIdToName[champions[champion].key] = champions[champion].name;
        }
    } catch (error) {
        console.error('Error fetching champion data:', error.response ? error.response.data : error.message);
    }
};

module.exports = {
    championIdToName,
    fetchChampionData
};
