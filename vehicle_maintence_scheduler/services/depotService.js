const axios = require("axios");
const getAccessToken = require("../../notification_app_be/services/authService");

async function fetchDepots() {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            "http://20.207.122.201/evaluation-service/depots",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data.depots;

    } catch (error) {

        console.log(error.response?.data || error.message);
    }
}

module.exports = fetchDepots;