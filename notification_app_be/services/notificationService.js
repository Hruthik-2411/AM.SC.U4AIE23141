const axios = require("axios");

const getAccessToken = require("./authService");

async function fetchNotifications() {

    try {

        const token = await getAccessToken();

        const response = await axios.get(
            "http://20.207.122.201/evaluation-service/notifications",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data.notifications;

    } catch (error) {

        console.log(error.response?.data || error.message);
    }
}

module.exports = fetchNotifications;