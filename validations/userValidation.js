const Joi = require("joi");
const {UserEnum} = require('../config/global');

const getUser = Joi.object({
  user_status: Joi.string().valid(UserEnum.APPROVE,UserEnum.DELETE,UserEnum.PENDING).optional(),
  search:Joi.string().optional(),
});

const signUpUser = Joi.object({
  user_name: Joi.string().min(3).max(50).required(),
  city: Joi.string().required(),
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
});

const signInUser = Joi.object({
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
});

const approveUser = Joi.object({
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
});
const deleteUser = Joi.object({
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
});
const restoreUser = Joi.object({
  mobile_number: Joi.string().pattern(/^[0-9]{10}$/).required(),
});

module.exports =  { getUser, signUpUser, signInUser, approveUser, deleteUser, restoreUser };

