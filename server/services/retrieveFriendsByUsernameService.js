const { dataResponse } = require("../utils/dataResponse");
const friendShipDAO = require("../repositories/friendshipDAO");
const userDAO = require("../repositories/userDAO");

async function getFriendsByUsername(username, status = "accepted") {
    try {
        // const data = {}
        // console.log(username);
        // data.message = "all good";
        // return dataResponse(200, "success", data);


        const data = {}

        if (!username || typeof username !== "string") {
            data.message = `invalid -username of type string is required`;
            return dataResponse(400, "fail", data);
        }

        const returnedUser = await userDAO.getUserByUsername(username);

        if (returnedUser.Count === 0) {
            data.message = `user ${username} not found`;
            return dataResponse(404, "success", data);
        }

        const { user_id: userId } = returnedUser.Items[0];

        // DAO layer function to get all friends by status
        const retrievedData = await friendShipDAO.retrieveAllFriendsByStatus(userId, status);

        // block to handle if no data is present
        if (retrievedData.Count === 0) {
            data.message = `no friends found`;
            return dataResponse(200, 'success', data);
        }

        // array to handle collection of users
        data.friendList = [];

        // block to return the friends returned
        retrievedData.Items.map(itemObj => {
            const friendObj = {
                ...itemObj
            }

            // pushing data to our new object
            data.friendList.push(friendObj);
        })

        data.message = `${retrievedData.Count} items found with status ${status}`;
        return dataResponse(200, 'success', data);
    } catch (error) {
        throw error;
    }
}

module.exports = { getFriendsByUsername }