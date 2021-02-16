import {makeStyles} from "@material-ui/core/styles";
import React, {useState} from "react";
import {basicFetch} from "../../helpers/common";
import Grid from "@material-ui/core/Grid";
import WaitForServer from "../loading";
import Typography from "@material-ui/core/Typography";
import Input from "@material-ui/core/Input";
import Slider from "@material-ui/core/Slider";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";

const useUpdateStyles = makeStyles(() => ({
    container: {
        padding: 20,
        justifyContent: "center",
    },
    teamSetContainer: {
        padding: 10,
        margin: 10,
        backgroundColor: 'floralwhite'
    },
    root: {
        width: 250,
    },
    input: {
        width: 42,
    },
    allInput: {
        fontSize: 18
    },
    error: {
        color: 'red',
        fontSize: '1.2em',
        margin: "auto",
        textAlign: "center"
    },
    submit: {
        // marginLeft: 100,
        marginTop: 10,
        // marginRight: 100,
        height: 60,
        // width: 500,
        fontSize: 19
    },
    nameFieldsContainer: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center"
    }
}));

export default function UpdateTeams (props) {
    const {tournament, tournamentId} = props;
    const styles = useUpdateStyles();
    const [loading, setLoading] = useState(false);
    const tournamentTeams = tournament.teams.length;
    const [numberOfTeams, setNumberOfTeams] = useState(tournamentTeams || 4);
    const [disableNumberChange, setDisableChange] = useState(tournament.teams.length !== 0);
    const fixturesGenerated = tournament.hasLeagueFixturesGenerated || !!tournament.currentRound;
    let defaultValues = {}
    tournament.teams.forEach((team, index) => {
        defaultValues[`teamName${index}`] = team.teamName;
        defaultValues[`playerName${index}`] = team.playerName;
    });
    const [values, setValues] = useState(defaultValues);

    const handleNames = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        setValues(prevState => ({...prevState, [name]: value}));
    }

    const handleSliderChange = (event, newValue) => {
        setNumberOfTeams(newValue);
    };

    const handleInputChange = (event) => {
        setNumberOfTeams(event.target.value === '' ? '' : Number(event.target.value));
    };
    const handleApplyAndEnableButton = () => {
        setDisableChange(prevState => {
            if (prevState) {
                if (!window.confirm(
                    'Changing this will clear unsaved values. ' +
                    'Do you want to continue?')) {
                    return prevState
                }
            } else return !prevState;
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        let teamNames = [];
        let playerNames = [];
        for (let i=0; i<numberOfTeams; i++) {
            teamNames.push(values[`teamName${i}`]);
            playerNames.push(values[`playerName${i}`]);
        }
        const nameValues = {teamNames, playerNames};
        basicFetch(`tournament/${tournamentId}/teams`, 'post', nameValues, setLoading, true, true);
    }
    const handleBlur = () => {
        if (numberOfTeams < 4) {
            setNumberOfTeams(4);
        } else if (numberOfTeams > 30) {
            setNumberOfTeams(30);
        }
    };
    return (
        <Grid container spacing={2} className={styles.container}>
            <WaitForServer wait={loading} />
            <Grid item xs={3}>
                <Typography>Number of Teams</Typography>
            </Grid>
            <Grid item xs={2}>
                <Input
                    className={styles.input}
                    value={numberOfTeams}
                    margin="dense"
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    inputProps={{
                        step: 1,
                        min: 4,
                        max: 30,
                        type: 'number',
                        'aria-labelledby': 'input-slider',
                        className: styles.allInput,
                        disabled: disableNumberChange
                    }}
                />
            </Grid>
            <Grid item xs={3}>
                <Slider
                    value={typeof numberOfTeams === 'number' ? numberOfTeams : 0}
                    min={4}
                    max={30}
                    onChange={handleSliderChange}
                    aria-labelledby="input-slider"
                    disabled={disableNumberChange}
                />
            </Grid>
            <Grid item xs={4}>
                <Button color="primary"
                        variant="outlined"
                        onClick={handleApplyAndEnableButton}
                        disabled={fixturesGenerated}
                >
                    {disableNumberChange ? "Enable Sliders" : "Apply"}
                </Button>
            </Grid>
            <Grid item className={styles.error}>
                {
                    fixturesGenerated &&
                    <Typography>
                        You can only change the player names as this tournament is already in progress.
                        <br />
                        <br />
                        In order to update the team names, reset the tournament's fixtures.
                    </Typography>
                }
            </Grid>
            <form className={styles.nameFieldsContainer}
                  onSubmit={handleSubmit}
            >
                {
                    !!disableNumberChange &&
                    new Array(numberOfTeams).fill(null).map((team, index) => (
                        <TeamPlayerName
                            key={index}
                            index={index}
                            values={values}
                            onChange={handleNames}
                            disabled={!disableNumberChange}
                            disableTeamNames={fixturesGenerated}
                        />
                    ))
                }
                {
                    !!disableNumberChange &&
                    <Button
                        type="submit"
                        variant="contained"
                        color="secondary"
                        className={styles.submit}
                        onClick={handleSubmit}
                        fullWidth={true}
                    >
                        Save
                    </Button>
                }
            </form>

        </Grid>
    )
}

function TeamPlayerName (props) {
    const styles = useUpdateStyles();
    const {index, disabled, disableTeamNames, values, onChange} = props;
    const teamNameInput = `teamName${index}`;
    const playerNameInput = `playerName${index}`;
    return (
        <Paper className={styles.teamSetContainer}>
            {index+1}
            <Grid container spacing={2} >
                <Grid item xs={12} sm={6}>
                    <TextField
                        autoComplete="team name"
                        name={teamNameInput}
                        variant="outlined"
                        required
                        fullWidth
                        id={teamNameInput}
                        label="Team Name"
                        inputProps={{className: styles.allInput}}
                        disabled={disabled || disableTeamNames}
                        value={values[teamNameInput] || ""}
                        onChange={onChange}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        variant="outlined"
                        fullWidth
                        id={playerNameInput}
                        label="Player Name"
                        name={playerNameInput}
                        autoComplete="player name"
                        inputProps={{className: styles.allInput, disabled: disabled}}
                        value={values[playerNameInput] || ""}
                        onChange={onChange}
                    />
                </Grid>
            </Grid>
        </Paper>

    )
}