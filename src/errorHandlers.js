export const badRequestHandler = (err, req, res, next) => {
    if (err.status === 400) {
      console.log("bad request", err);
      res.status(400).send({ message: err.message, errorsList: err.errorsList });
    } else {
      next(err);
    }
  };
  
  export const unauthorizedHandler = (err, req, res, next) => {
    if (err.status === 401) {
      console.log("unauthorized request", err);
      res.status(401).send({ message: err.message });
    } else {
      next(err);
    }
  };
  
  export const notFoundHandler = (err, req, res, next) => {
    if (err.status === 404) {
      console.log("not found request", err);
      res.status(404).send({ message: err.message });
    } else {
      next(err);
    }
  };
  
  export const genericErrorHandler = (err, req, res, next) => {
    console.log("error handler, here is the error: ", err);
    res.status(500).send({ message: "Generic Server Error!" });
  };
  
  export const forbiddenHandler = (err, req, res, next) => {
    if (err.status === 403) {
      res
        .status(403)
        .send({ message: err.message || "You are not allowed to do that!" });
    } else {
      next(err);
    }
  };