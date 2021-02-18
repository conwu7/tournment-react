import React, {useState, useEffect} from "react";
import Paper from "@material-ui/core/Paper";
import Box from "@material-ui/core/Box";
import {makeStyles} from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import {basicFetch} from "../../helpers/common";
import WaitForServer from "../loading";

const useResults = makeStyles((theme) => ({
    root: {
        flexGrow: 1,
        width: '100%',
    },
    resultsContainer: {
        paddingTop: 15,
        paddingLeft: 5,
        paddingRight: 5,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
    },
    resultSet: {
        minWidth: "40%",
        marginBottom: 15,
        backgroundColor: "whitesmoke"
    },
    resultBox: {
        display: "flex",
        minHeight: 45,
        padding: 5,
        justifyContent: "center",
        alignItems: "center"
    },
    goals: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 40,
        width: 40,
        marginLeft: 2,
        marginRight: 2,
        borderRadius: 4,
        backgroundColor: "#C71585",
        color: "whitesmoke",
        fontFamily: "'Rubik Mono One', sans-serif !important"
    },
    team: {
        width: 100,
        alignSelf: "center",
        fontWeight: "bold"
    },
    homeTeam: {
        textAlign: "right",
        paddingRight: 10
    },
    awayTeam: {
        textAlign: "left",
        paddingLeft: 10
    },
    advanced: {
        color: "seagreen"
    },
    submit: {
        marginTop: 10,
        marginBottom: 20,
        width: "80%"
    },
    error: {
        color: 'red',
        fontWeight: 'bold',
        fontSize: "1.2em",
        margin: "auto",
        textAlign: "center"
    },
    resultInput: {
        textAlign: "center",
        fontWeight: "bolder",
        backgroundColor: "white"
    },
    closed: {
        fontWeight: "bold"
    }
}));
function handleInputResults (updateFunc) {
    return (e) => {
        const name = e.target.name;
        const value = e.target.value;
        e.target.style.backgroundColor = "white";
        updateFunc(prevState => ({...prevState, [name]: value}));
    }
}
function getScoreString (score) {
    if (score === 0 || score === "0") return "0"
    if (!score) return ""
    return score;
}
function addResult(goalsFor, goalsAgainst, results) {
    if (isNaN(goalsFor) || isNaN(goalsAgainst)) results.push(null);
    else results.push([goalsFor, goalsAgainst]);
}
function isInvalidScore (inputName, value, opposingInputId) {
    if (value < 0) {
        document.getElementById(inputName).style.backgroundColor = "#f4c7c7";
        return true
    }
    const opposingInput = document.getElementById(opposingInputId);
    const opposingInputHasValue = !!opposingInput.value;
    if (!isNaN(value) && !opposingInputHasValue) {
        opposingInput.style.backgroundColor = "#f4c7c7";
        return true
    }
    return false;

}

export function KnockoutTeamResults (props) {
    const {roundFixtures, teams, useTwoLegs, tournamentId, isUpdatingResults, isCurrentRound} = props;
    const [loading, setLoading] = useState(false);
    const styles = useResults();
    const setTeamNames = (fixture, teams) => {
        let firstTeam, secondTeam, automaticWinner;
        if (fixture.isEmpty) {
            firstTeam = secondTeam = "(empty)";
        } else if (roundFixtures[fixture.opponentIndex].isEmpty) {
            firstTeam = teams[fixture.teamIndex].teamName;
            secondTeam = "(empty)";
            automaticWinner = true;
        } else {
            firstTeam = teams[fixture.teamIndex].teamName;
            secondTeam = teams[roundFixtures[fixture.opponentIndex].teamIndex].teamName;
        }
        return {firstTeam, secondTeam, automaticWinner};
    }
    const [updatedResults, setUpdatedResults] = useState({});
    const handleResults = handleInputResults(setUpdatedResults);
    const setInitialValues = (inputName, value) => {
        setUpdatedResults(prevState => ({...prevState, [inputName]: value}));
    }
    const handleSubmit = () => {
        const numberOfTeamsLeft = roundFixtures.length;
        const results = [];
        for (let i=0; i<numberOfTeamsLeft; i++) {
            if (!useTwoLegs && i%2 === 1) return results.push(null);
            const homeFor = parseInt(updatedResults[`homeGoalsFor${i}`]);
            const homeAgainst = parseInt(updatedResults[`homeGoalsAgainst${i}`]);
            const neutralFor = parseInt(updatedResults[`neutralGoalsFor${i}`]);
            const neutralAgainst = parseInt(updatedResults[`neutralGoalsAgainst${i}`]);
            // halt if score is invalid
            if (useTwoLegs) {
                if (isInvalidScore(`homeGoalsFor${i}`, homeFor, `homeGoalsAgainst${i}`)) return
                if (isInvalidScore(`homeGoalsAgainst${i}`, homeAgainst, `homeGoalsFor${i}`)) return
                addResult(homeFor, homeAgainst, results);
            } else {
                if (isInvalidScore(`neutralGoalsFor${i}`, neutralFor, `neutralGoalsAgainst${i}`)) return
                if (isInvalidScore(`neutralGoalsAgainst${i}`, neutralAgainst, `neutralGoalsFor${i}`)) return
              addResult(neutralFor, neutralAgainst, results);
            }
        }
        const values = {results};
        const url = `tournament/${tournamentId}/knockoutResults`;
        basicFetch(url, 'put', values, setLoading, true, true);
    }

    return (
        <Container className={styles.resultsContainer} >
            <WaitForServer wait={loading} />
            {
                ( !isCurrentRound && isUpdatingResults ) ?
                    <Grid item className={styles.error}>
                        <Typography>
                            <span className={styles.closed}>THIS ROUND IS CLOSED</span>
                            <br />
                            <br />
                            TO UPDATE RESULTS ON THIS TAB, CLEAR THE CURRENT ROUND FIXTURES
                        </Typography>
                    </Grid>
                : isUpdatingResults &&
                <>
                    <Grid item className={styles.error}>
                        <Typography>
                            ALL UNSAVED CHANGES WILL BE CLEARED WHEN SWITCHING TABS
                            <br />
                            <br />
                            ONLY FULL MATCH RESULT ENTRIES ARE SAVED
                        </Typography>
                    </Grid>
                    <Button
                        type="button"
                        variant="contained"
                        color="secondary"
                        className={styles.submit}
                        onClick={handleSubmit}
                        disabled={!isCurrentRound}
                    >
                        Save Results
                    </Button>
                </>
            }
            {
                useTwoLegs &&
                roundFixtures.map((fixture, index) => {
                    if (index % 2 === 1) return null
                    const {firstTeam, secondTeam, automaticWinner} = setTeamNames(fixture, teams);
                    const homeFor = getScoreString(fixture.home.goalsFor);
                    const homeAgainst = getScoreString(fixture.home.goalsAgainst);
                    const awayFor = getScoreString(fixture.away.goalsFor);
                    const awayAgainst = getScoreString(fixture.away.goalsAgainst);
                    return (
                        <Paper key={index} className={styles.resultSet}>
                        {/*home result*/}
                            <Result
                                home={firstTeam}
                                away={secondTeam}
                                homeAutoAdvance={automaticWinner}
                                goalsFor={homeFor || "-"}
                                goalsAgainst={homeAgainst || "-"}
                                isUpdatingResults={isUpdatingResults}
                                goalsForComp={
                                    <ResultInput defaultValue={homeFor}
                                                 name={`homeGoalsFor${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 disabled={automaticWinner || !isCurrentRound}
                                    />
                                }
                                goalsAgainstComp={
                                    <ResultInput defaultValue={homeAgainst}
                                                 name={`homeGoalsAgainst${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 disabled={automaticWinner || !isCurrentRound}
                                    />
                                }
                            />
                            {/*away result */}
                            <Result
                                home={secondTeam}
                                away={firstTeam}
                                awayAutoAdvance={automaticWinner}
                                goalsFor={awayAgainst || "-"}
                                goalsAgainst={awayFor || "-"}
                                isUpdatingResults={isUpdatingResults}
                                goalsForComp={
                                    <ResultInput defaultValue={awayAgainst}
                                                 name={`homeGoalsFor${index+1}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 disabled={automaticWinner || !isCurrentRound}
                                    />
                                }
                                goalsAgainstComp={
                                    <ResultInput defaultValue={awayFor}
                                                 name={`homeGoalsAgainst${index+1}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 disabled={automaticWinner || !isCurrentRound}
                                    />
                                }
                            />
                        </Paper>
                    )
                })
            }
            {
                !useTwoLegs &&
                roundFixtures.map((fixture, index) => {
                    if (index % 2 === 1) return null
                    const {firstTeam, secondTeam, automaticWinner} = setTeamNames(fixture, teams);
                    const neutralFor = getScoreString(fixture.neutral.goalsFor);
                    const neutralAgainst = getScoreString(fixture.neutral.goalsAgainst);
                    return (
                        <Paper key={index} className={styles.resultSet}>
                            <Result
                                home={firstTeam}
                                away={secondTeam}
                                homeAutoAdvance={automaticWinner}
                                goalsFor={neutralFor || "-"}
                                goalsAgainst={neutralAgainst || "-"}
                                isUpdatingResults={isUpdatingResults}
                                goalsForComp={
                                    <ResultInput defaultValue={neutralFor}
                                                 name={`neutralGoalsFor${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 disabled={automaticWinner || !isCurrentRound}
                                    />
                                }
                                goalsAgainstComp={
                                    <ResultInput defaultValue={neutralAgainst}
                                                 name={`neutralGoalsAgainst${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 disabled={automaticWinner || !isCurrentRound}
                                    />
                                }
                            />
                        </Paper>
                    )
                })
            }
            {
                isUpdatingResults &&
                <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    className={styles.submit}
                    onClick={handleSubmit}
                    disabled={!isCurrentRound}
                >
                    Save Results
                </Button>
            }
        </Container>
    )
}

export function LeagueTeamResults (props) {
    const {teamFixtures, teamName, teamIndex, teams, useTwoLegs,
            tournamentId ,isUpdatingResults} = props;
    const [loading, setLoading] = useState(false);
    const styles = useResults();

    const [updatedResults, setUpdatedResults] = useState({});
    const handleResults = handleInputResults(setUpdatedResults);
    const setInitialValues = (inputName, value) => {
        setUpdatedResults(prevState => ({...prevState, [inputName]: value}));
    }
    const handleSubmit = () => {
        const numberOfTeams = teams.length;
        const home = [];
        const away = [];
        const neutral = [];
        for (let i=0; i<numberOfTeams; i++) {
            const homeFor = parseInt(updatedResults[`homeGoalsFor${i}`]);
            const homeAgainst = parseInt(updatedResults[`homeGoalsAgainst${i}`]);
            const awayFor = parseInt(updatedResults[`awayGoalsFor${i}`]);
            const awayAgainst = parseInt(updatedResults[`awayGoalsAgainst${i}`]);
            const neutralFor = parseInt(updatedResults[`neutralGoalsFor${i}`]);
            const neutralAgainst = parseInt(updatedResults[`neutralGoalsAgainst${i}`]);
            // halt if score is invalid
            if (useTwoLegs) {
                if (isInvalidScore(`homeGoalsFor${i}`, homeFor)) return
                if (isInvalidScore(`homeGoalsAgainst${i}`, homeAgainst)) return
                if (isInvalidScore(`awayGoalsFor${i}`, awayFor)) return
                if (isInvalidScore(`awayGoalsAgainst${i}`, awayAgainst)) return
                addResult(homeFor, homeAgainst, home);
                addResult(awayFor, awayAgainst, away);
            } else {
                if (isInvalidScore(`neutralGoalsFor${i}`, neutralFor)) return
                if (isInvalidScore(`neutralGoalsAgainst${i}`, neutralAgainst)) return
                addResult(neutralFor, neutralAgainst, neutral);
            }
        }
        const values = {teamIndex, home, away, neutral};
        const url = `tournament/${tournamentId}/leagueResults`;
        basicFetch(url, 'put', values, setLoading, true, true);
    }


    return (
        <Container className={styles.resultsContainer}>
            <WaitForServer wait={loading}/>
            {
                isUpdatingResults &&
                    <>
                        <Grid item className={styles.error}>
                            <Typography>
                                ALL UNSAVED CHANGES WILL BE CLEARED WHEN SWITCHING TABS
                                <br />
                                ONLY FULL MATCH RESULT ENTRIES ARE SAVED
                            </Typography>
                        </Grid>
                        <Button
                            type="button"
                            variant="contained"
                            color="secondary"
                            className={styles.submit}
                            onClick={handleSubmit}
                        >
                            Save Results
                        </Button>
                    </>
            }
            {
                useTwoLegs &&
                teamFixtures.home.map((fixture, index) => {
                    if (fixture && fixture.isSameTeam) return null
                    const homeGoalsFor = fixture && fixture.goalsFor.toString();
                    const homeGoalsAgainst = fixture && fixture.goalsAgainst.toString();
                    const awayGoalsFor = teamFixtures.away[index] && teamFixtures.away[index].goalsFor.toString();
                    const awayGoalsAgainst = teamFixtures.away[index] && teamFixtures.away[index].goalsAgainst.toString();
                    return (
                        <Paper key={index} className={styles.resultSet}>
                            {/*home result*/}
                            <Result
                                home={teamName}
                                away={teams[index].teamName}
                                goalsFor={homeGoalsFor}
                                goalsAgainst={homeGoalsAgainst}
                                handleResults={handleResults}
                                useTwoLegs={useTwoLegs}
                                isUpdatingResults={isUpdatingResults}
                                goalsForComp={
                                    <ResultInput defaultValue={homeGoalsFor || ""}
                                                 name={`homeGoalsFor${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                                 />
                                }
                                goalsAgainstComp={
                                    <ResultInput defaultValue={homeGoalsAgainst || ""}
                                                 name={`homeGoalsAgainst${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                    />
                                }
                            />
                            {/*away result*/}
                            {/*teams and scores are reversed on away*/}
                            <Result
                                home={teams[index].teamName}
                                away={teamName}
                                goalsFor={awayGoalsAgainst}
                                goalsAgainst={awayGoalsFor}
                                handleResults={handleResults}
                                useTwoLegs={useTwoLegs}
                                isUpdatingResults={isUpdatingResults}
                                goalsForComp={
                                    <ResultInput defaultValue={awayGoalsAgainst || ""}
                                                 name={`awayGoalsAgainst${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                    />
                                }
                                goalsAgainstComp={
                                    <ResultInput defaultValue={awayGoalsFor || ""}
                                                 name={`awayGoalsFor${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                    />
                                }
                            />
                        </Paper>
                    )
                })
            }
            {
                !useTwoLegs &&
                teamFixtures.neutral.map((fixture, index) => {
                    if (fixture && fixture.isSameTeam) return null
                    const neutralGoalsFor = fixture && fixture.goalsFor.toString();
                    const neutralGoalsAgainst = fixture && fixture.goalsAgainst.toString();
                    return (
                        <Paper key={index} className={styles.resultSet}>
                            {/*neutral result*/}
                            <Result
                                home={teamName}
                                away={teams[index].teamName}
                                goalsFor={neutralGoalsFor}
                                goalsAgainst={neutralGoalsAgainst}
                                handleResults={handleResults}
                                useTwoLegs={useTwoLegs}
                                isUpdatingResults={isUpdatingResults}
                                goalsForComp={
                                    <ResultInput defaultValue={neutralGoalsFor || ""}
                                                 name={`neutralGoalsFor${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                    />
                                }
                                goalsAgainstComp={
                                    <ResultInput defaultValue={neutralGoalsAgainst || ""}
                                                 name={`neutralGoalsAgainst${index}`}
                                                 onChange={handleResults}
                                                 onMount={setInitialValues}
                                    />
                                }
                            />
                        </Paper>
                    )
                })
            }
            {
                isUpdatingResults &&
                <Button
                    type="button"
                    variant="contained"
                    color="secondary"
                    className={styles.submit}
                    onClick={handleSubmit}
                >
                    Save Results
                </Button>
            }
        </Container>
    )
}

function ResultInput (props) {
    const {name, defaultValue, onChange, onMount, disabled} = props;
    const styles = useResults();
    useEffect(() => {
        onMount(name, defaultValue);
    }, []);
    return (
        <TextField
            defaultValue={defaultValue}
            disabled={disabled}
            id={name}
            inputProps={{max: 999, min: 0, className: styles.resultInput}}
            name={name}
            placeholder="-"
            onChange={onChange}
            required
            type="number"
            variant="outlined"
            // fullWidth
            // id={teamNameInput}
            // label="Team Name"
            // disabled={disabled || disableTeamNames}
            // value={values[teamNameInput] || ""}
        />
    )
}

function Result (props) {
    const styles = useResults();
    const {home, away, goalsFor, goalsAgainst, homeAutoAdvance, awayAutoAdvance,
            isUpdatingResults, goalsForComp, goalsAgainstComp} = props;
    return (
        <Box className={styles.resultBox}>
            <Typography className={`${styles.team} ${styles.homeTeam}`}>
                {home}
                {
                    homeAutoAdvance &&
                    <>
                        <br />
                        <span className={styles.advanced}>(auto adv)</span>
                    </>
                }
            </Typography>
            {
                !isUpdatingResults &&
                    <>
                        <Typography className={styles.goals}>
                            {isNaN(parseInt(goalsFor)) ? "-" : goalsFor}
                        </Typography>
                        <Typography className={styles.goals}>
                            {isNaN(parseInt(goalsAgainst)) ? "-" : goalsAgainst}
                        </Typography>
                    </>
            }
            {
                isUpdatingResults &&
                    <>
                        {goalsForComp}
                        {goalsAgainstComp}
                    </>
            }
            <Typography className={`${styles.team} ${styles.awayTeam}`}>
                {away}
                {
                    awayAutoAdvance &&
                    <>
                        <br />
                        <span className={styles.advanced}>(auto adv)</span>
                    </>
                }
            </Typography>
        </Box>
    )
}