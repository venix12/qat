<template>
    <div class="row align-items-center" style="min-height: 30px">
        <div class="col-sm-9">
            <a
                class="ml-2"
                :href="`https://osu.ppy.sh/beatmapsets/${request.beatmapset.osuId}`"
                target="_blank"
            >
                {{ request.beatmapset.fullTitle }}
            </a>
        </div>
        <div class="col-sm-3 d-flex justify-content-around">
            <div>{{ request.createdAt | toMonthDay }}</div>
            <div :class="getStatusClass(request.modReviews)">
                {{ getStatus(request.modReviews) }}
            </div>
        </div>
        <div v-if="request.modReviews.length" class="col-sm-12">
            <div v-for="review in request.modReviews" :key="review._id" class="ml-2 text-secondary">
                <user-link
                    :osu-id="review.user.osuId"
                    :username="review.user.username"
                />
                <span :class="review.action == 'accepted' ? 'text-success' : 'text-warning'">
                    ({{ review.action }})
                </span>
                - {{ review.comment }}
            </div>
        </div>
    </div>
</template>

<script>
import UserLink from '../UserLink.vue';

export default {
    name: 'MyRequestRow',
    components: {
        UserLink,
    },
    props: {
        request: {
            type: Object,
            required: true,
        },
    },
    methods: {
        getStatus (reviews) {
            if (reviews.find(r => r.action === 'accepted')) return 'Accepted';
            if (reviews.find(r => r.action === 'denied')) return 'Not Accepted';

            return 'Pending';
        },
        getStatusClass (reviews) {
            if (reviews.find(r => r.action === 'accepted')) return 'text-success';
            if (reviews.find(r => r.action === 'denied')) return 'text-warning';

            return '';
        },
    },
};
</script>
