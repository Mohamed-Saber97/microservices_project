const Joi = require('joi');

const validatePost = (data)=> {
    const schema = Joi.object({
      content: Joi.string().min(3).max(100).required(),
      mediaIds: Joi.array(),
    });

    return schema.validate(data);
}


module.exports = {
    validatePost,
};