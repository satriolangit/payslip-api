const Joi = require("@hapi/joi");
const filter = (schema, property) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, schema);
    const valid = error == null;

    //console.log('enter filter', error);

    if (valid) {
      next();
    } else {
      const { details } = error;
      //const message = details.map(i => i.message).join(',');
      console.log("error", error);
      //console.log('error', message);
      //res.status(422).json({ error: message });
    }
  };
};
module.exports = filter;
