const axios = require("axios");
const getAccessToken = require("../../notification_app_be/services/authService");

async function fetchVehicles() {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            "http://20.207.122.201/evaluation-service/vehicles",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data.vehicles;

    } catch (error) {

        console.log(error.response?.data || error.message);
    }
}

module.exports = fetchVehicles;