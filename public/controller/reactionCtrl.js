// get model
var reaction_model = require('../model/reaction');

// function
function create(_kind_reaction, _id_post_reaction, _url_post_reaction, _click_reaction_day, _id_shop, _id_user) {
    if (_kind_reaction !== undefined) {
        var tmp_kind_reaction = JSON.parse(_kind_reaction);
    } else {
        tmp_kind_reaction = null;
    }

    var reaction = new reaction_model({
        kind_reaction: tmp_kind_reaction,
        id_post_reaction: _id_post_reaction,
        url_post_reaction: _url_post_reaction,
        click_reaction_day: _click_reaction_day,
        id_shop: _id_shop,
        id_user: _id_user
    });

    reaction.save(function (err) {
        if (err) return err;
    });
}

// api
module.exports = {
    //create reaction
    create: function (req, res) {
        create(req.body.kind_reaction, req.body.id_post_reaction, req.body.url_post_reaction, req.body.click_reaction_day, req.body.id_shop, req.body.id_user);
        repsonse = { 'error_code': 0, 'message': 'create reaction complete' };
        res.status(200).json(repsonse);
    },
    getAll: function (req, res) {
        reaction_model.find({}, function (err, data) {
            if (err) {
                repsonse = { 'error_code': 1, 'message': 'error fetching data' };
            } else {
                repsonse = { 'error_code': 0, 'reaction': data };
                res.status(200).json(repsonse);
            }
        })
    }
}