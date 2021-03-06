<template>
    <section class="slide-container">
        <transition :name="slideTransition">
            <game-hub-component v-if="currentlyPlaying" @rematch="restartGame"></game-hub-component>
            <div v-else class="landing-container">
                <header>
                    <img src="../assets/images/typetime_logo.svg">
                    <h1 @mouseover="resetTitle" @mouseout="restartShuffle">{{shuffledTitle}}</h1>
                </header>
                <div class="interactions">
                    <div>
                        <button-component :content="startContent" :disableButton="!launchableGame" @bigButtonClick="launchGame"></button-component>
                    </div>
                    <div class="mod-diff-container">
                        <checkboxes-component
                            :switches="selectedModifiers"
                            :titleCategory="modTitle"
                            :disableButtons="safeMode"
                            :refreshable="true"
                            @refreshCheckboxes="refreshModifiers"
                            @toggleCheck="toggleModifiers">
                        </checkboxes-component>
                        <checkboxes-component
                            :switches="difficulties"
                            :titleCategory="diffTitle"
                            :disableButtons="false"
                            :refreshable="false"
                            @toggleCheck="toggleDifficulties">
                        </checkboxes-component>
                    </div>
                </div>
                <nav>
                    <router-link v-bind:to="'/typetime/about'" v-on:click.native="resetTitle">About</router-link>
                </nav>
            </div>
        </transition>
    </section>
</template>

<script>
import random from '@/core/random.js';
import gameTuning from '@/core/gameTuning.js';
import wordSelection from '@/core/wordSelection.js';
import {KEY_SOUNDS} from '@/conf/sounds.js';
import {BASE_WORDS_PER_MINUTE, SNAIL_WORDS_PER_MINUTE} from '@/conf/gameSettings';
import {MODS_TO_SHOW} from '@/conf/modifiersFrame';

import buttonComponent from '@/components/buttons/Button.vue';
import checkboxesComponent from '@/components/sections/Checkboxes.vue';
import gameHubComponent from '@/components/game/GameHub.vue';

export default {
    name: 'Landing',

    components: {
        'button-component': buttonComponent,
        'checkboxes-component': checkboxesComponent,
        'game-hub-component': gameHubComponent,
    },

    data() {
        return {
            title: 'TypeTime',
            shuffledTitle: 'TypeTime',
            shouldShuffleTitle: true,
            shouldSlideFromRight: true,
            shuffleTitleTimer: null,
            firstShuffleTitleTimer: 3000,
            startContent: 'start',
            launchableGame: false,
            modTitle: 'Modifiers',
            diffTitle: 'Difficulties',
            selectedModifiers: gameTuning.getEmptyMods(),
            modifiers: gameTuning.getModifiers(),
            keySounds: KEY_SOUNDS,
        };
    },

    methods: {
        overwriteTitleCycle() {
            clearTimeout(this.shuffleTitleTimer);
            if (this.shouldShuffleTitle) {
                this.shuffledTitle = this.shuffleTitle();
                new Audio(random.selectRandomEntity(this.keySounds)).play();
                this.shuffleTitleTimer = window.setTimeout(this.overwriteTitleCycle, random.randomNum(3000, 200));
            }
        },

        shuffleTitle() {
            let movableLettersIndices = [1, 2, 3, 5, 6];
            let titleCopy = this.title.split('');
            const firstLetterIndice = movableLettersIndices.splice(random.randomNum(movableLettersIndices.length, 0), 1);
            const firstLetter = this.title[firstLetterIndice];
            const secondLetterIndice = movableLettersIndices.splice(random.randomNum(movableLettersIndices.length, 0), 1);
            const secondLetter = titleCopy.splice(secondLetterIndice, 1, firstLetter)[0];
            titleCopy.splice(firstLetterIndice, 1, secondLetter).join('');
            return titleCopy.join('');
        },

        resetTitle() {
            this.shouldShuffleTitle = false;
            this.shuffledTitle = this.title;
        },

        restartShuffle() {
            this.shouldShuffleTitle = true;
            this.overwriteTitleCycle();
        },

        toggleModifiers(toggledModifierId) {
            const toggledModifier = this.selectedModifiers.find(modifier => modifier.id === toggledModifierId);
            this.uncheckRelatedModifiers(toggledModifier);
            toggledModifier.isChecked = !toggledModifier.isChecked;
            this.$store.commit('setWordsContext', {
                wordsContext: gameTuning.getWordsContext(this.modifiers, this.selectedModifiers),
            });
        },

        uncheckRelatedModifiers(toggledModifier) {
            let clusterMods = [];
            if (toggledModifier.modCluster === 'all') {
                clusterMods = this.selectedModifiers;
            } else {
                clusterMods = this.selectedModifiers.filter(modifier => modifier.modCluster === toggledModifier.modCluster || modifier.modCluster === 'all');
            }
            for (let mod of clusterMods) {
                if (mod !== toggledModifier) {
                    mod.isChecked = false;
                }
            }
        },

        async launchGame() {
            try {
                this.shouldShuffleTitle = false;
                this.shouldSlideFromRight = true;
                this.$store.commit('resetLevelRules');
                this.$store.commit('setWordsPerMinute', {
                    wordsPerMinute: this.difficulties.filter(d => d.id === 'isSnail')[0].isChecked ? SNAIL_WORDS_PER_MINUTE : BASE_WORDS_PER_MINUTE, // special case
                });
                this.$store.commit('setAllotedWordBaseTime');
                this.$store.commit('resetScore');
                this.$store.commit('setDifficultyNaming', {
                    difficultyNaming: gameTuning.buildDifficultyNaming(this.difficulties.filter(d => d.isChecked)),
                });
                this.$store.commit('startGame');
                this.$store.commit('setWordsSelectionRules', {
                    wordsSelectionRules: wordSelection.getLevelRule(this.$store.state.rules.gameDifficulties.isMasochist, this.$store.state.rules.levelRules.currentLevel),
                });
                this.$store.dispatch('requestAndSetWordsToType', {
                    wordAmount: this.$store.state.rules.levelRules.wordAmount,
                    wordsContext: this.$store.state.wordsContext,
                    wordsSelectionRules: this.$store.state.rules.wordsSelectionRules,
                    isSafeMode: this.safeMode,
                });
            } catch (err) {
                const askForSafeMode = window.confirm('It seems the internets does\'nt gave us enough words.\r\rDo you want to try in "safe mode"?');
                this.$store.commit('setSafeMode', {safeMode: askForSafeMode});
                this.restartGame();
            }
        },

        async selectModifiers() {
            try {
                this.modifiers.push(...await gameTuning.getNewModifiers(!this.safeMode));
                this.selectedModifiers = random.spliceRandomEntities(MODS_TO_SHOW, this.modifiers);
                this.$store.commit('setWordsContext', {
                    wordsContext: gameTuning.getWordsContext(this.modifiers, this.selectedModifiers),
                });
                this.launchableGame = true;
            } catch (error) {
                const askForSafeMode = window.confirm('It seems the internets does\'nt gave us enough modifiers.\r\rDo you want to try in "safe mode"?');
                this.$store.commit('setSafeMode', {safeMode: askForSafeMode});
                this.restartGame();
            }
        },

        refreshModifiers() {
            if (this.safeMode) {
                this.$store.commit('setSafeMode', {safeMode: false});
            }
            this.selectModifiers();
        },

        toggleDifficulties(toggledDifficultyId) {
            const toggledDifficulty = this.difficulties.find(dif => dif.id === toggledDifficultyId);
            this.$store.commit('setDifficulty', {settingId: toggledDifficultyId, isChecked: !toggledDifficulty.isChecked});
        },

        restartGame() {
            this.shouldSlideFromRight = false;
            this.shouldShuffleTitle = true;
            this.overwriteTitleCycle();
            this.selectedModifiers = gameTuning.getEmptyMods();
            this.modifiers = gameTuning.getModifiers();
            this.selectModifiers();
        },
    },

    computed: {
        slideTransition() {
            return this.shouldSlideFromRight ? 'slide-fade-right' : 'slide-fade-left';
        },

        currentlyPlaying() {
            return this.$store.state.currentlyPlaying;
        },

        difficulties() {
            return gameTuning.getDifficulties().map(difficulty => {
                difficulty.isChecked = this.$store.state.rules.gameDifficulties[difficulty.id];
                return difficulty;
            });
        },

        safeMode() {
            return this.$store.state.safeMode;
        },
    },

    mounted() {
        if (this.shouldShuffleTitle) {
            this.shuffleTitleTimer = window.setTimeout(() => {
                this.overwriteTitleCycle();
            }, this.firstShuffleTitleTimer);
        };
        this.selectModifiers();
    },
};
</script>

<style lang="scss" scoped>
    @import '../styles/common';
    @import '../styles/slides';

    .slide-container {
        width: 100%;
        height: 100%;
        text-align: center;

        &>div {
            width: 100%;
            height: 100%;
        }

        .landing-container {

            header {
                height: 200px;
                position: relative;
                padding: 2rem;

                img {
                    max-width: 200px;
                }

                h1 {
                    font-weight: $bold-weight;
                    font-size: $big-font-size;
                    margin: 0;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    transform: translate(-50%, -50%);
                }
            }

            nav {
                padding: 0.5rem 1rem 2rem;
            }
        }
    }
</style>
