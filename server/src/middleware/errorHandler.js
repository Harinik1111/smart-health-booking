module.exports = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let status = err.status || 500;
  let message = err.message;

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value: this record already exists';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  }

  if (status === 500) {
    console.error(err);
    message = 'Internal server error';
  }
  res.status(status).json({ message });
};
