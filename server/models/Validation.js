const Joi = require("joi");

//USER VALIDATION

//Registration Validation
const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

//Login Validation
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;

//POST VALIDATION

//Creation Validation
const postValidation = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(300).required(),
    text: Joi.string().min(1).max(600).required(),
  });
  return schema.validate(data);
};

module.exports.postValidation = postValidation;

//COMMENT VALIDATION

const commentValidation = (data) => {
  const schema = Joi.object({
    text: Joi.string().min(1).max(300).required(),
  });
  return schema.validate(data);
};

module.exports.commentValidation = commentValidation;
