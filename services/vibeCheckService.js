const { dataResponse } = require("../utils/dataResponse")
const dao = require("../repositories/vibeCheckDAO")
const uuid = require("uuid")
const logger = require("../utils/logger")
const userDao = require("../repositories/userDAO")

async function createVibeCheck(user_id, username, album_id, review, rating) {
  /*
  function expects:
    -user_id, username from token
    -album_id, review, rating from body
  */
  try {
    const data = {}
    //check valid user_id from request
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    //check if review is not empty and rating is 1-5
    if (typeof review !== "string" || !review) {
      data.message = "Review can't be non string or missing"
      return dataResponse(401, "fail", data)
    }
    if (review.trim() == "") {
      data.message = "Review can't be empty"
      return dataResponse(401, "fail", data)
    }
    if (typeof rating !== "number" || !rating) {
      data.message = "Rating can't be non number or missing"
      return dataResponse(401, "fail", data)
    }
    if (rating < 0 || rating >= 6) {
      data.message = "Rating has to be 1-5"
      return dataResponse(401, "fail", data)
    }
    if (typeof album_id !== "object" || !album_id) {
      data.message = "Album_id cant be non object or missing"
      return dataResponse(401, "fail", data)
    }

    const vibe_check_id = uuid.v4()
    const timestamp = Date.now()
    const vibeCheck = {
      vibe_check_id,
      user_id,
      username,
      album_id,
      review,
      rating,
      comments: [],
      likes: 0,
      dislikes: 0,
      disliked_by: [],
      liked_by: [],
      timestamp,
    }
    await dao.addItem(vibeCheck)
    const newlyCreatedVibeCheck = await getVibeCheckById(user_id, vibe_check_id)

    if (!newlyCreatedVibeCheck) {
      data.message = "New VibeCheck couldn't be retrieve possibly not created"
      return dataResponse(401, "fail", data)
    }
    data.newlyCreatedVibeCheck = newlyCreatedVibeCheck.data.returnedVibeCheck
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to create vibeCheck: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

// service layer function for creating a comment on a vibecheck
async function createComment(user_id, username, vibe_check_id, comment_body) {
  try {
    const data = {}
    //verifies that the user and vibecheck both exist
    const returnedVibeCheck = await dao.getItemById(vibe_check_id)
    const returnedUser = await userDao.findUserById(user_id)

    if (!returnedVibeCheck) {
      data.message = "VibeCheck does not exist"
      return dataResponse(404, "fail", data)
    } else if (!returnedUser) {
      data.message = "User does not exist"
      return dataResponse(404, "fail", data)
    } else {
      //creates the comment object with a unique uuid and timestamp
      const comment_id = uuid.v4()
      const timestamp = Date.now()
      const comment = {
        comment_id,
        user_id,
        username,
        comment_body,
        timestamp,
      }
      // uses dao function to insert the comment object into the database
      const newComment = await dao.addCommentToVibeCheck(vibe_check_id, comment)

      if (newComment) {
        data.message = "Comment created successfully"
        return dataResponse(201, "success", data)
      }
    }
  } catch (err) {
    return dataResponse(500, "fail", {
      message: "failed to confirm vibeChecks existence",
    })
  }
}

// service layer function for removing a comment
async function removeComment(user_id, vibe_check_id, comment_id) {
  try {
    const data = {}
    // verifies that the user exists
    const returnedUser = await userDao.findUserById(user_id)
    if (returnedUser < 1) {
      data.message = "user does not exist"
      return dataResponse(400, "fail", data)
    } else {
      try {
        // attempts to use the dao function to delete the comment
        const deleteComment = await dao.deleteComment(
          vibe_check_id,
          comment_id,
          user_id
        )
        if (deleteComment) {
          data.message = "comment deleted successfully"
          return dataResponse(201, "success", data)
        }
      } catch (err) {
        console.log(
          "failed to call function deleteComment in service layer: ",
          err
        )
      }
    }
    console.log("here is the user: ", returnedUser.Items)
  } catch (err) {
    console.log(
      "failed to call functions findUserById in the service layer: ",
      err
    )
  }
}

async function getVibeCheckById(user_id, vibe_check_id) {
  /*
  `function expects:
    -user_id from token
    -vibe_check_id from params
  */
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    if (vibe_check_id == "") {
      data.message = "vibe_check_id can't be empty"
      return dataResponse(401, "fail", data)
    }
    const returnedVibeCheck = await dao.getItemById(vibe_check_id)
    if (!returnedVibeCheck.Item) {
      data.message = "Couldn't get vibeCheck"
      return dataResponse(401, "fail", data)
    }
    data.returnedVibeCheck = returnedVibeCheck.Item
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to get vibeCheck by ID: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

async function getAllVibeChecks(user_id) {
  /*
  function expects:
    -user_id from token
  */
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    const returnedVibeChecks = await dao.getAllItems()
    if (
      returnedVibeChecks.Count === 0 ||
      returnedVibeChecks.Items.length === 0
    ) {
      data.message = "VibeChecks couldn't be retrieved"
      return dataResponse(401, "fail", data)
    }
    data.returnedVibeChecks = returnedVibeChecks.Items
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to get all vibeChecks: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

async function deleteVibeCheck(user_id, vibe_check_id) {
  /*
`function expects:
  -user_id from token
  -vibe_check_id from params
*/
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    if (vibe_check_id === "" || !vibe_check_id) {
      data.message = "vibe_check_id can't be empty"
      return dataResponse(401, "fail", data)
    }
    const deletedItem = await dao.deleteItem(vibe_check_id)
    if (!deletedItem.Attributes) {
      data.message = "Vibecheck wasn't deleted"
      return dataResponse(401, "fail", data)
    }
    data.deletedVibeCheck = deletedItem.Attributes
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to delete vibeCheck: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

async function likeOrDislike(user_id, username, vibe_check_id, type) {
  /*
  function expects:
    -type of 'like' or 'dislike' from params
    -vibe_check_id from params
    -username, user_id from token
  */
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    //checks
    if (!type || type.trim() == "") {
      data.message = "like or dislike can't be empty"
      return dataResponse(401, "fail", data)
    }
    if (vibe_check_id.trim() == "") {
      data.message = "vibe_check_id can't be empty"
      return dataResponse(401, "fail", data)
    }
    const checkVCExists = await getVibeCheckById(user_id, vibe_check_id)
    if (checkVCExists.status !== "success") {
      data.message = "VibeCheck doesn't exist"
      return dataResponse(401, "fail", data)
    }
    if (type !== "like" && type !== "dislike") {
      data.message = "type must be like or dislike"
      return dataResponse(401, "fail", data)
    }
    //check if user already liked or disliked
    const vibeCheck = await getVibeCheckById(user_id, vibe_check_id)
    let likeValue = 1
    let dislikeValue = 1
    let updatedArray = []
    if (vibeCheck.data.returnedVibeCheck.liked_by.includes(username)) {
      likeValue = -1
      updatedArray = vibeCheck.data.returnedVibeCheck.liked_by.filter(
        (id) => id !== username
      )
    }
    if (vibeCheck.data.returnedVibeCheck.disliked_by.includes(username)) {
      dislikeValue = -1
      updatedArray = vibeCheck.data.returnedVibeCheck.disliked_by.filter(
        (id) => id !== username
      )
    }

    //for likes
    if (type.trim() == "like") {
      let updatedLikedBy = null
      const updatedVibeCheck = await dao.updateItemLikes(
        vibe_check_id,
        likeValue
      )
      //if value 1 then user not in liked_by so add it if not remove it
      if (likeValue == 1) {
        updatedLikedBy = await dao.addItemLikedBy([username], vibe_check_id)
      } else {
        updatedLikedBy = await dao.removeItemLikedBy(
          updatedArray,
          vibe_check_id
        )
      }
      if (!updatedVibeCheck.Attributes) {
        data.message = "like didn't go through"
        return dataResponse(401, "fail", data)
      }
      data.updatedVibeCheck = updatedVibeCheck.Attributes
      data.updatedLikedBy = updatedLikedBy.Attributes
      return dataResponse(200, "success", data)
    }
    //for dislikes
    if (type.trim() == "dislike") {
      let updatedDislikedBy = null
      const updatedVibeCheck = await dao.updateItemDislikes(
        vibe_check_id,
        dislikeValue
      )
      if (dislikeValue == 1) {
        updatedDislikedBy = await dao.addItemDislikedBy(
          [username],
          vibe_check_id
        )
      } else {
        updatedDislikedBy = await dao.removeItemDislikedBy(
          updatedArray,
          vibe_check_id
        )
      }
      if (!updatedVibeCheck.Attributes) {
        data.message = "dislike didn't go through"
        return dataResponse(401, "fail", data)
      }
      data.updatedVibeCheck = updatedVibeCheck.Attributes
      data.updatedDislikedBy = updatedDislikedBy.Attributes
      return dataResponse(200, "success", data)
    }
  } catch (error) {
    logger.error(
      `Failed to update vibeCheck's likes/dislikes: ${error.message}`,
      {
        stack: error.stack,
      }
    )
    throw new Error(error.message)
  }
}

async function getVibeChecksByUserId(user_id, target_user_id) {
  /*
  function expects:
    -user_id from token
    -target_user_id from params
  */
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    if (!target_user_id) {
      data.message = "No target user_id was provided"
      return dataResponse(401, "fail", data)
    }
    const checkIdExists = await userDao.findUserById(target_user_id)
    if (checkIdExists.Items.length === 0) {
      data.message = "No user was found with that id"
      return dataResponse(401, "fail", data)
    }
    const returnedVibeChecks = await dao.getItemsByUserId(target_user_id)
    if (
      returnedVibeChecks.Count === 0 ||
      returnedVibeChecks.Items.length === 0
    ) {
      data.message = "VibeChecks for target_user_id couldn't be retrieved"
      return dataResponse(401, "fail", data)
    }
    data.returnedVibeChecks = returnedVibeChecks.Items
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to get user's VibeChecks: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

async function getVibeChecksByUsername(user_id, target_username) {
  /*
function expects:
  -user_id from token
  -target_username from params
*/
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    if (!target_username) {
      data.message = "No target username was provided"
      return dataResponse(401, "fail", data)
    }
    const checkIdExists = await userDao.getUserByUsername(target_username)
    if (checkIdExists.Items.length === 0) {
      data.message = "No user was found with that username"
      return dataResponse(401, "fail", data)
    }
    const returnedVibeChecks = await dao.getItemsByUsername(target_username)
    if (
      returnedVibeChecks.Count === 0 ||
      returnedVibeChecks.Items.length === 0
    ) {
      data.message = "VibeChecks for target_username couldn't be retrieved"
      return dataResponse(401, "fail", data)
    }
    data.returnedVibeChecks = returnedVibeChecks.Items
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to get user's VibeChecks: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

async function deleteAllVibeChecksByUserId(user_id) {
  /*
function expects:
  -user_id from token
*/
  try {
    const data = {}
    if (!user_id) {
      data.message = "No user_id was passed, might have to refresh session"
      return dataResponse(401, "fail", data)
    }
    const vibeChecks = await getVibeChecksByUserId(user_id, user_id) //in this case user and target_user are the same
    if (!vibeChecks?.data?.returnedVibeChecks?.length) {
      data.message = "No vibeChecks returned by getVibeChecksByUserId"
      return dataResponse(404, "fail", data)
    }
    const vibeCheckIds = vibeChecks.data.returnedVibeChecks.map((vc) => {
      return { vibe_check_id: vc.vibe_check_id }
    })
    data.batchResult = await dao.batchDeleteVibeChecks(vibeCheckIds)
    return dataResponse(200, "success", data)
  } catch (error) {
    logger.error(`Failed to delete user's VibeChecks: ${error.message}`, {
      stack: error.stack,
    })
    throw new Error(error.message)
  }
}

module.exports = {
  createVibeCheck,
  getVibeCheckById,
  getAllVibeChecks,
  deleteVibeCheck,
  likeOrDislike,
  getVibeChecksByUserId,
  deleteAllVibeChecksByUserId,
  getVibeChecksByUsername,
  createComment,
  removeComment,
}
