const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require("../models/favorite");

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter
    .route("/")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .populate('user')
            .populate('dishes')
            .exec((err, favorite) => {
                if (err) return next(err);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(favorite);
            });

    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (favorite) {
                        req.body.forEach((dish) => {
                            if (favorite.dishes.indexOf(dish._id) === -1) {
                                favorite.dishes.push(dish._id);
                            }
                        });
                        favorite.save()
                            .then(
                                (favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorite);
                                },
                                (err) => next(err)
                            );
                    } else {
                        Favorites.create({ user: req.user._id, dishes: req.body })
                            .then(
                                (favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader("Content-Type", "application/json");
                                    res.json(favorite);
                                },
                                (err) => next(err)
                            );
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites");
    }
    )
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOneAndRemove({ user: req.user._id }, (err, resp) => {
            if (err) return next(err);  
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(resp);
        });
    });
    
favoriteRouter
    .route("/:dishId")
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (!favorite) {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        return res.json({ "exists": false, "favorites": favorite });
                    } else {
                        if (favorite.dishes.indexOf(req.params.dishId) < 0) {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({ "exists": false, "favorites": favorite });
                        } else {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            return res.json({ "exists": true, "favorites": favorite });
                        }
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }, (err, favorite) => {
            if (err) return next(err);
            if (!favorite) {
                Favorites.create({ user: req.user._id, dishes: [req.params.dishId] })
                    .then(
                        (favorite) => {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        },
                        (err) => next(err)
                    );
            } else {
                if (favorite.dishes.indexOf(req.params.dishId) === -1) {
                    favorite.dishes.push(req.params.dishId);
                    favorite.save()

                        .then(
                            (favorite) => {
                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.json(favorite);
                            }
                        );
                } else {
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.json(favorite);
                }
            }
        });
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end("PUT operation not supported on /favorites/" + req.params.dishId);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(
                (favorite) => {
                    if (favorite) {
                        const index = favorite.dishes.indexOf(req.params.dishId);
                        if (index >= 0) {
                            favorite.dishes.splice(index, 1);
                            favorite.save()
                                .then(
                                    (favorite) => {
                                        res.statusCode = 200;
                                        res.setHeader("Content-Type", "application/json");
                                        res.json(favorite);
                                    },
                                    (err) => next(err)
                                );
                        } else {
                            res.statusCode = 200;
                            res.setHeader("Content-Type", "application/json");
                            res.json(favorite);
                        }
                    } else {
                        res.statusCode = 200;
                        res.setHeader("Content-Type", "application/json");
                        res.json(favorite);
                    }
                },
                (err) => next(err)
            )
            .catch((err) => next(err));
    });

module.exports = favoriteRouter;

