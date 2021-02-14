import React, {useCallback, useEffect, useState} from "react";
import Container from "@material-ui/core/Container";
import {makeStyles} from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import WaitForServer from "../loading";
import {fetchApi} from "../../helpers/common";
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Box from '@material-ui/core/Box';
import Button from "@material-ui/core/Button";
import {AppBar} from "@material-ui/core";
import {Switch, Route, useHistory, useLocation} from 'react-router-dom';

import {LeagueFixtures} from "../fixtures";
import LeagueTable from "../league-table";
import Admin from "../admin";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`scrollable-auto-tabpanel-${index}`}
            aria-labelledby={`scrollable-auto-tab-${index}`}
            {...other}
        >
            {value === index && (
                <>
                    {children}
                </>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `scrollable-auto-tab-${index}`,
        'aria-controls': `scrollable-auto-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme) => ({
    root: {
        paddingTop: 10,
        paddingBottom: 10
    },
    pageHeader: {
        color: "darkslategray",
        wordBreak: 'break-all',
        marginBottom: 10,
        padding: 10,
        fontWeight: "bold"
    },
    indicator: {
        backgroundColor: "darkslategray",
    },
    tabItem: {
        '&:selected': {
            fontWeight: "bold"
        }
    },
    tabPanelContainer: {
        marginTop: 10
    },
    teamContainer: {
        display: "flex",
        flexWrap: "wrap",
        padding: 0,
        justifyContent: "center"
    },
    noFixtures: {
        padding: 20,
        textAlign: "center"
    }
}));

export default function Tournament (props) {
    const {tournamentId, user} = props;
    const styles = useStyles();
    const [loading, setLoadingStatus] = useState(false);
    const [tournament, setTournament] = useState({notSet: true});
    const [isLeague, setLeague] = useState(false);
    const [teams, setTeams] = useState([]);
    const [fixturesDocument, setFixturesDoc] = useState({notSet: true});
    const [tableData, setTableData] = useState([]);
    const location = useLocation();
    const path = location.pathname.split('/');
    const page = path[path.length -1];
    const startingPage =
        ['table', 'admin', 'teams'].includes(page) ? page : 'fixtures';
    const [currentPage, setCurrentPage] = React.useState(startingPage);
    const history = useHistory();
    const handleChange = (event, newValue) => {
        setCurrentPage(newValue);
        const baseUrl = `/tournament/${tournamentId}`;
        if (newValue === "fixtures") {
            history.push(`${baseUrl}`)
        } else {
            history.push(`${baseUrl}/${newValue}`);
        }
    };
    // get fixtures on mount
    const getTournamentAndFixtures = useCallback(async () => {
        setLoadingStatus(true);
        let tournament = {};
        try {
            tournament = await fetchApi(`tournament/${tournamentId}`, 'get');
            if (tournament === null) return setTournament({notFound: true});
            setTournament(tournament);
            setTeams(tournament.teams);
            setLeague(!tournament.isKnockout);
            const fixtures = await fetchApi(`tournament/${tournamentId}/fixtures`, 'get');
            setFixturesDoc(fixtures);
            if (!tournament.isKnockout) {
                const tableData = await fetchApi(`tournament/${tournamentId}/leagueTable`, 'get');
                setTableData(tableData);
            }
        } catch (e) {
            if (!tournament.name) setTournament({notFound: true});
            console.log(e);
        } finally {
            setTimeout(()=>setLoadingStatus(false), 100);
        }
    }, [tournamentId])
    useEffect(() => {
        getTournamentAndFixtures()
            .catch(undefined);
    }, [getTournamentAndFixtures]);
    if (tournament.notFound) return (
        <Container maxWidth="lg" className={styles.root}>
            <Typography>TOURNAMENT NOT FOUND</Typography>
        </Container>
    )
    if (tournament.notSet) return (
        <Container maxWidth="lg" className={styles.root}>
            <Typography>LOADING</Typography>
        </Container>
    )
    if (currentPage === "admin" && !tournament.notSet && !tournament.notFound &&
        tournament.admin.username !== user) {
        setCurrentPage('fixtures');
    }
    return (
        <Container maxWidth="lg" className={styles.root}>
            <WaitForServer wait={loading}/>
            <Paper elevation={2}>
                <Typography variant="h6" align="center" className={styles.pageHeader}>
                    {tournament.name}
                </Typography>
            </Paper>
            <AppBar position="static" color="default">
                <Tabs
                    value={currentPage}
                    onChange={handleChange}
                    classes={{indicator: styles.indicator}}
                    textColor="primary"
                    centered
                >
                    <Tab label="Fixtures"
                         className={styles.tabItem}
                         {...a11yProps(0)}
                        value="fixtures"
                    />
                    {
                        tournament && !tournament.isKnockout &&
                        <Tab label="Table"
                             className={styles.tabItem}
                             {...a11yProps(1)}
                            value="table"
                        />
                    }

                    <Tab label="Teams"
                         className={styles.tabItem}
                         {...a11yProps(2)}
                        value="teams"
                    />
                    {
                        !tournament.notSet && tournament.admin.username === user &&
                        <Tab label="ADMIN"
                             className={styles.tabItem}
                             {...a11yProps(2)}
                             value="admin"
                        />
                    }
                </Tabs>
            </AppBar>
            <Box className={styles.tabPanelContainer}>
                <Switch>
                    <Route path="/tournament/:id/table">
                        {
                            isLeague &&
                            <TabPanel value={currentPage} index="table">
                                {
                                    !tournament.hasLeagueFixturesGenerated &&
                                    <Paper className={styles.noFixtures}>
                                        Fixtures have not been generated yet.
                                    </Paper>
                                }
                                {
                                    tableData.length !== 0 &&
                                    <LeagueTable tableData={tableData}/>
                                }
                            </TabPanel>
                        }
                    </Route>
                    <Route path="/tournament/:id/teams">
                        <TabPanel value={currentPage}
                                  index="teams"
                                  className={styles.teamContainer}>
                            {
                                teams.map((team, index) => (
                                    <Team key={index}
                                          team={team}
                                          index={index}
                                    />
                                ))
                            }
                        </TabPanel>
                    </Route>
                    <Route path="/tournament/:id/admin">
                        <TabPanel value={currentPage}
                                  index="admin"
                                  >
                            <Admin tournament={tournament}
                            />
                        </TabPanel>
                    </Route>
                    <Route path="/tournament/:id">
                        <TabPanel value={currentPage}
                                  index="fixtures">
                            {
                                !tournament.hasLeagueFixturesGenerated &&
                                <Paper className={styles.noFixtures}>
                                    Fixtures have not been generated yet.
                                </Paper>
                            }
                            {
                                isLeague && tournament.hasLeagueFixturesGenerated &&
                                !fixturesDocument.notSet &&
                                <LeagueFixtures
                                    teams={teams}
                                    fixtures={fixturesDocument.leagueFixtures}
                                    useTwoLegs={tournament.useTwoLegs}
                                />
                            }
                        </TabPanel>
                    </Route>
                </Switch>
            </Box>
        </Container>
        )
}


const useTeamsStyle = makeStyles((theme) => ({
    teamBox: {
        display: "flex",
        flexDirection: "column",
        padding: 5,
        margin: 5,
        borderRadius: 5,
        width: "fit-content"
    },
    teamButton: {
        display: "flex",
        justifyContent: "space-between",
        textAlign: "left",
        backgroundColor: "#f5e1e1",
        '&:hover': {
            backgroundColor: "#f5e1e1",
        },
        width: 300,
        margin: "auto"
        // alignSelf: "center"
    },
    teamIndex: {
        fontSize: 24,
        color: "brown",
        fontFamily: "'Rubik Mono One', sans-serif !important"
    },
    name: {
        paddingTop: 5,
        paddingBottom: 5,
        fontWeight: theme.typography.fontWeightBold,
    },
    owner: {
        margin: 0,
        padding: 5,
        paddingLeft: 10,
        textAlign: "left",
        fontStyle: "italic",
        width: 300,
    }
}));
function Team (props) {
    const {team, index} = props;
    const styles = useTeamsStyle();
    return (
        <Box className={`${styles.teamBox}`}
             size="large"
        >
            <Button
                className={styles.teamButton}
                variant="contained"
                // onClick={navigateToTournament}
            >
                <Typography className={styles.teamIndex}>{index+1}</Typography>
                <Typography className={styles.name}>
                    {team.teamName}
                </Typography>
            </Button>
            <Typography
                paragraph={true}
                className={styles.owner}
            >
                Owner: {team.playerName || "(empty)"}
            </Typography>
        </Box>
    )
}