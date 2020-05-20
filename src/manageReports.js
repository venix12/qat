import './bootstrap';
import Vue from 'vue';
import Vuex from 'vuex';
import toastsModule from './modules/toasts';
import ManageReportsPage from './pages/ManageReportsPage.vue';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        toasts: toastsModule,
    },
    state: {
        openReports: [],
        closedReports: [],
        selectedReportId: null,
        isQueried: false,
    },
    mutations: {
        setOpenReports (state, reports) {
            state.openReports = reports;
        },
        setClosedReports (state, reports) {
            state.closedReports = reports;
        },
        setSelectedReportId (state, id) {
            state.selectedReportId = id;
        },
        setIsQueried (state, value) {
            state.isQueried = value;
        },

        // modify data
        updateOpenReport (state, report) {
            const i = state.openReports.findIndex(r => r.id === report.id);
            if (i !== -1) Vue.set(state.openReports, i, report);
        },
    },
    getters: {
        allReports: (state) => {
            return state.openReports.concat(state.closedReports);
        },
        selectedReport: (state, getters) => {
            return getters.allReports.find(v => v.id === state.selectedReportId);
        },
    },
    actions: {
        updateReport ({ commit, state }, report) {
            if (report.isActive) {
                commit('updateOpenReport', report);
            } else {
                let reports = [...state.openReports];
                const i = state.openReports.findIndex(r => r.id === report.id);
                reports.splice(i,1);
                commit('setOpenReports', reports);
                commit('setClosedReports', [report]);
                commit('setIsQueried', true);
            }

            if (state.selectedReport && state.selectedReport.id === report.id) {
                commit('setSelectedReportId', report.id);
            }
        },
    },
    strict: process.env.NODE_ENV !== 'production',
});

new Vue({
    el: '#app',
    store,
    components: {
        ManageReportsPage,
    },
});
