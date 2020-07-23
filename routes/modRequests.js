const express = require('express');
const moment = require('moment');
const ModRequest = require('../models/modRequest');
const middlewares = require('../helpers/middlewares');
const util = require('../helpers/util');
const osu = require('../helpers/osu');

function getGenreName (id) {
    // note that there's no 8, 11, 12
    switch (id) {
        case 0:
            return 'Any';
        case 1:
            return 'Unspecified';
        case 2:
            return 'video game';
        case 3:
            return 'anime';
        case 4:
            return 'rock';
        case 5:
            return 'pop';
        case 6:
            return 'other';
        case 7:
            return 'novelty';
        case 9:
            return 'hip hop';
        case 10:
            return 'electronic';
        case 13:
            return 'folk';
        default:
            return 'Unknown';
    }
}

function getLanguageName (id) {
    switch (id) {
        case 0:
            return 'Any';
        case 1:
            return 'other';
        case 2:
            return 'english';
        case 3:
            return 'japanese';
        case 4:
            return 'chinese';
        case 5:
            return 'instrumental';
        case 6:
            return 'korean';
        case 7:
            return 'french';
        case 8:
            return 'german';
        case 9:
            return 'swedish';
        case 10:
            return 'spanish';
        case 11:
            return 'italian';
        default:
            return 'Unknown';
    }
}

const defaultPopulate = [
    {
        path: 'user',
        select: 'osuId username groups',
    },
    {
        path: 'reviews',
        populate: {
            path: 'user',
            select: 'osuId username groups',
        },
    },
];

const router = express.Router();

/* GET show index */
router.get('/', (req, res) => {
    if (!req.session.mongoId) {
        req.session.lastPage = req.originalUrl;
    }

    res.render('modrequests', {
        layout: false,
    });
});

/* GET show index */
router.get('/relevantInfo', middlewares.isLoggedIn, async (req, res) => {
    const user = res.locals.userRequest;
    const ownRequests = await ModRequest
        .find({ user: user._id })
        .populate(defaultPopulate);
    let requests = [];

    if (user.isFeatureTester) {
        requests = await ModRequest
            .find({})
            .populate(defaultPopulate)
            .sort({ createdAt: -1 });
    }

    res.json({
        ownRequests,
        user,
        requests,
    });
});

/* POST create request */
router.post('/store', middlewares.isLoggedIn, async (req, res) => {
    const { category, link, comment } = req.body;

    util.isValidUrlOrThrow(link, 'https://osu.ppy.sh/beatmapsets/');
    const beatmapsetId = util.getBeatmapsetIdFromUrl(link);
    const cooldown = moment().subtract(1, 'month');
    const hasRequested = await ModRequest.findOne({
        user: req.session.mongoId,
        $or: [
            { 'beatmapset.osuId': parseInt(beatmapsetId, 10) },
            { createdAt: { $gte: cooldown.toDate() } },
        ],
    });

    if (hasRequested) {
        return res.json({
            error: 'Already requested within the month',
        });
    }

    const beatmapsetInfo = await osu.getBeatmapsetInfo(req.session.accessToken, beatmapsetId);

    if (beatmapsetInfo.user_id != res.locals.userRequest.osuId) {
        return res.json({
            error: `Cannot submit others people's maps.. for now`,
        });
    }

    const modes = [...new Set(beatmapsetInfo.beatmaps.map(b => b.mode))];

    const request = new ModRequest();
    request.user = req.session.mongoId;
    request.category = category;
    request.beatmapset = {
        osuId: beatmapsetInfo.id,
        artist: beatmapsetInfo.artist,
        title: beatmapsetInfo.title,
        modes,
        genre: getGenreName(beatmapsetInfo.genre.id),
        language: getLanguageName(beatmapsetInfo.language.id),
        numberDiffs: beatmapsetInfo.beatmaps.length,
        length: beatmapsetInfo.beatmaps[0].total_length,
        bpm: beatmapsetInfo.bpm,
        submittedAt: beatmapsetInfo.submitted_date,
    };
    request.comment = comment;
    await request.save();

    res.json({
        success: 'Saved',
    });
});

router.post('/:id/review', middlewares.isLoggedIn, async (req, res) => {
    if (!res.locals.userRequest.isFeatureTester) {
        return res.json({
            error: 'Unauthorized',
        });
    }

    const request = await ModRequest
        .findById(req.params.id)
        .populate(defaultPopulate)
        .orFail();

    const review = {
        user: req.session.mongoId,
        action: req.body.action,
        comment: req.body.comment,
    };
    const i = request.reviews.findIndex(r => r.user.id == req.session.mongoId);

    if (i !== -1) {
        request.reviews.splice(i, 1, review);
    } else {
        request.reviews.push(review);
    }

    await request.save();

    res.json({
        success: 'Saved',
        request,
    });
});

module.exports = router;
