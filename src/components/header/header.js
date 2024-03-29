import "./header.css";
import {useRef, useState, useEffect} from "react";
import Modal from "react-modal";
import Button from "./button";
import bayportLogo from "./bayportlogo.png";
import background from "./image.png";
import {useMutation} from "react-query";
import {Api} from "../../tools/api";
import {generateRandomLetters, generateRandomNumber} from "../../tools/functions";

Modal.setAppElement("#root");

export default function Header({toggleInvisibleExisting, toggleInvisibleNew}) {
    const [isOpen, setIsOpen] = useState(false);

    const [cycle, setStateCycle] = useState("start");

    const [membership, setMembership] = useState("no");

    const [isButtonVisible, setButtonVisible] = useState(true);

    const applyButton = useRef();

    // initialise the api
    const [api] = useState(new Api());
    // stores OTP ID and OTP code when being sent
    const [otp, setOTP] = useState({id: '', code: ''});
    // stores user inputs from modal
    const [inputs, setInputs] = useState({phone: ' ', enteredOTP: ' ', omang: ' '});
    // for existing customer, store the state of their login -- i.e OTP verified or not
    const [clientLoggedIn, setClientLoggedIn] = useState(false);
    // stores current client's data in this component
    const [client, setClient] = useState({});

    // for sending an SMS
    const {
        mutate: mutateSendSMS,
        isLoading: mutateSendSMSLoading,
        isSuccess: mutateSendSMSSuccess,
        isError: mutateSendSMSError,
        error: mutateSendSMSErrorMessage
    } = useMutation('sendSMS', api.sendSMS, {retry: 2});

    // for getting a client
    const {
        data: clientsData,
        mutate: mutateGetClients,
        isLoading: mutateGetClientsLoading,
        isSuccess: mutateGetClientsSuccess,
        isError: mutateGetClientsError,
        error: mutateGetClientsErrorMessage,
        reset: mutateGetClientsReset
    } = useMutation('getClients', api.getClients, {retry: 2});

    // whenever clientsData changes, set current client to the 0th client from results
    useEffect(()=>{
        let currentClient;
        if (clientsData?.length > 0) currentClient = clientsData[0];

        // TODO set current client to something in the context -- if needed
        setClient(currentClient);

        console.log(currentClient)
    }, [clientsData])

    // check if the phone number entered is the same as in the db
    const confirmPhone = () => {
        // client's phone number from db
        let dbPhone = ' ';
        // ensure current client is not undefined from previous steps
        if (client) dbPhone = client.phoneNumber.trim();
        else alert('No client data, please refresh this page.')

        // check equivalence
        if (dbPhone.trim() == inputs.phone.trim()) {
            // send the OTP to the number
            sendOTP();
            // proceed to otp modal
            changeCycle("otp");
        }
            // TODO: replace with proper error message
        // no match send error
        else alert('Client\'s phone number not on record, please refresh this page.')
    }

    // send OTP message
    const sendOTP = async () => {
        // generate random letters
        const id = await generateRandomLetters(4);
        // generate random 4 digit OTP
        const code = await generateRandomNumber(4);
        // update OTP state and display
        setOTP({id, code});

        // get phone number from info, and create message
        const params = {
            recipient: `${inputs.phone}`,
            message: `Dear customer, \n\nYour OTP for ${id} is ${code}`
        }

        // send OTP message
        mutateSendSMS(params);
    }

    // confirm an OTP entered by user
    const verifyOTP = () => {

        if (inputs.otp.trim() == otp.code) {
            // successful, allow login
            setClientLoggedIn(true)
        }

        // incorrect otp, shpw error message
        else alert('Incorrect OTP, please try again.')
        // @TODO edit error showing as required
    }

    // get a clint's details form the database using their omang
    const getClientDetails = () => {
        // clear whatever is currently stored
        mutateGetClientsReset();
        // check db for client using omang
        mutateGetClients([{field: 'omang', value: inputs.omang}])

        // move to searching dialogue
        changeCycle('searching_client')
    }

    const changeCycle = value => {
        setStateCycle(value);
    };

    const changeCycleAndSend = value => {
        var formData = new FormData();
        formData.append("Handler", "SendTextMessage");
        formData.append("Username", "Bayport");
        formData.append("Password", "bay123");
        formData.append("From", "");
        formData.append("To", "74720855");
        formData.append("Message", "test");
        formData.append("Options", "0");

        let url = "http://83.143.26.34/MMWebService/MessageMaster.aspx";
        // TODO: Fix cors error
        fetch(url, {
            method: "POST",
            headers: new Headers({
                "Access-Control-Allow-Origin": "no-cors"
            }),
            body: formData
        })
            .then(resp => console.info(resp.json()))
            .catch(e => console.error(e));
    };

    const toggleVisibilityExisting = () => {
        toggleInvisibleExisting();
        setIsOpen(false);
    };

    const toggleVisibilityNew = () => {
        toggleInvisibleNew();
        setIsOpen(false);
    };

    const toggleModal = () => {
        setStateCycle("start");
        setIsOpen(!isOpen);
        // console.log(applyButton.current)
        setButtonVisible(false);
    };

    const modelComponents = () => {
        let components = null;

        switch (cycle) {
            case "start":
                components = (
                    <div className="membership-modal">
                        <div className="close" onClick={toggleModal}>
                            close
                        </div>
                        <div>
                            <h1>Welcome</h1>
                        </div>
                        <div>
                            <p>Are you a new or existing customer?</p>
                        </div>
                        <div className="radio-options">
              <span>
                <input
                    type="radio"
                    name="membership"
                    value="no"
                    onChange={e => setMembership(e.target.value)}
                />{" "}
                  New
              </span>
                            <span>
                <input
                    type="radio"
                    name="membership"
                    value="yes"
                    onChange={e => setMembership(e.target.value)}
                />{" "}
                                Existing
              </span>
                        </div>
                        <div className="proceed">
                            <Button
                                onclick={() => {
                                    if (membership === "yes") {
                                        changeCycle(membership);
                                    } else {
                                        toggleVisibilityNew();
                                    }
                                }}
                                label="Proceed"
                            />
                        </div>
                    </div>
                );
                break;
            case "no":
                components = (
                    <div className="otp-modal">
                        <div className="close" onClick={toggleModal}>
                            close
                        </div>
                        <div className="title">
                            <h1>Proceed</h1>
                        </div>
                        <div>
                            <p></p>
                        </div>
                        <div className="proceed">
                            <Button onclick={() => toggleVisibilityNew()} label="Proceed"/>
                        </div>
                    </div>
                );
                break;
            case "yes":
                components = (
                    <>
                        <div className="membership-modal">
                            <div className="close" onClick={toggleModal}>
                                close
                            </div>
                            <div className="title">
                                <h1>ID Verification</h1>
                            </div>
                            <div>
                                <p>Please enter your ID / Passport Number</p>
                            </div>
                            <input
                                type="text"
                                id={"inputOmang"} name={"inputOmang"}
                                placeholder="ID / Passport Number"
                                onChange={(e) => {
                                    setInputs({...inputs, omang: `${e.target.value}`.trim()})
                                }}/>
                            {/* <div onClick={() => changeCycle("otp")}>
                                <p>Proceed</p>
                            </div> */}
                            <div className="proceed">
                                <Button
                                    onclick={() => getClientDetails()}
                                    label="Proceed"
                                />
                            </div>
                        </div>
                    </>
                );
                break;

                // while waiting for client details to arrive
            case "searching_client":
                components = (
                    <>
                        <div className="membership-modal">
                            <div className="close" onClick={toggleModal}>
                                close
                            </div>
                            <div className="title">
                                <h1>Searching for Client</h1>
                            </div>

                            {/*show while query is loading */}
                            {mutateGetClientsLoading &&
                                <div>
                                    <p><i>Kindly wait while we search for your details...</i></p>
                                </div>
                            }

                            {/*show if error occurred with query*/}
                            {mutateGetClientsError &&
                            <div>
                                <p>An error occurred, please refresh this page</p>
                            </div>
                            }


                            {(clientsData?.length > 0)
                                ?
                                // searching complete and clients data is not empty array
                                <>
                                    <div>
                                        <p>Client found. Please Proceed.</p>
                                    </div>
                                    <div className="proceed">
                                        <Button
                                            // go to phone number confirmation
                                            onclick={() => changeCycle('confirm_no')}
                                            label="Proceed"
                                        />
                                    </div>
                                </>

                                :
                                // no data there yet, check if successful
                                (mutateGetClientsSuccess &&
                                    // successful query, client must not have been found
                                    <>
                                        <div>
                                            <p>Omang not found. Please go back and check again, or restart as a new customer.</p>
                                        </div>
                                        <div className="proceed">
                                            <Button
                                                onclick={() => changeCycle('yes')}
                                                label="Back"
                                            />
                                        </div>
                                    </>
                                )

                            }

                        </div>
                    </>
                );
                break;

            case "confirm_no":
                components = (
                    <>
                        <div className="membership-modal">
                            <div className="close" onClick={toggleModal}>
                                close
                            </div>
                            <div className="title">
                                <h1>Phone Number Confirmation</h1>
                            </div>

                            <div>
                                <p>Please enter the contact number used in your application. Ends with <i>{clientsData[0].phoneNumber.slice(-2)}</i> </p>
                            </div>
                            {/* onChange update the enteredPhone for confirmation with phone number in db*/}
                            <input type="text"
                                   placeholder="Phone Number"
                                   id={"inputPhone"} name={"inputPhone"}
                                   onChange={(e) => setInputs({...inputs, phone: e.target.value})}/>
                            {/* <div onClick={() => changeCycle("otp")}>
                                <p>Proceed</p>
                            </div> */}
                            <div className="proceed">
                                <Button

                                    onclick={() => confirmPhone()}
                                    label="Confirm"
                                />
                            </div>
                        </div>
                    </>
                );
                break;

            case "otp":
                components = (
                    <div className="otp-modal">
                        <div className="close" onClick={toggleModal}>
                            close
                        </div>
                        <div className="title">
                            <h1>OTP Verification Code</h1>
                        </div>


                        {!clientLoggedIn
                            ?
                            // client is not logged in, verify otp first
                            <div className="proceed">>
                                <div>
                                    <p>Please enter the verification code for {otp.id} sent to {inputs.phone}</p>
                                </div>
                                <input type="text" placeholder={`OTP Code ${otp.id} - `}
                                       onChange={(e) => setInputs({...inputs, otp: e.target.value})}/>
                                <Button
                                    onclick={() => verifyOTP()}
                                    label="Verify OTP"
                                />

                                {/*/!*in case of any issues, allow resending of OTP*!/*/}
                                {/*<br />*/}
                                {/*<div>*/}
                                {/*    <p><i>I did not receive an OTP..</i></p>*/}
                                {/*</div>*/}
                                {/*<Button*/}
                                {/*    onclick={() => sendOTP()}*/}
                                {/*    label="Verify OTP"*/}
                                {/*/>*/}
                            </div>

                            :

                            // client OTP is verified is now, proceed
                            <div className={'proceed'}>
                                <div>
                                    <p>OTP verified successfully.</p>
                                </div>
                                <Button
                                    onclick={() => {
                                        toggleVisibilityExisting();
                                        // reset login state in case of redo
                                        setClientLoggedIn(false);
                                    }}
                                    label="Proceed"
                                />
                            </div>
                        }

                    </div>
                );
                break;
            default:
                components = <h1>Error</h1>;
                break;
        }

        return components;
    };

    return (
        <>
            <header>
                <div className="logo">
                    {/* <h3>LOGO</h3> */}
                    <img
                        src={bayportLogo}
                        style={{marginLeft: "50px"}}
                        height="60px"
                        alt=""
                    />
                </div>
                <div className="contact">
                    <div className="c-title">Call anytime</div>
                    <div className="c-subtitle">(+267) 393 6456</div>
                </div>
            </header>
            <main
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundPositionX: "80%"
                }}
            >
                <h3>Welcome to Bayport</h3>
                <h1>Apply For A Loan That Is Right For You</h1>

                {/*{isButtonVisible ? (*/}
                {/*  <div className="button-calculate" onClick={toggleModal}>*/}
                {/*    <p ref={applyButton}>Calculate Loan</p>*/}
                {/*  </div>*/}
                {/*) : null}*/}

                {/*keep visible in case of cancel*/}
                <div className="button-calculate" onClick={toggleModal}>
                    <p ref={applyButton}>Calculate Loan</p>
                </div>

                <br/>
                <br/>

                <div className="description">
                    <div className="top-border">
                        <p>Quick Payment</p>
                    </div>
                    <div className="top-border">
                        <p>Competitive Interest</p>
                    </div>
                </div>
            </main>
            <Modal
                isOpen={isOpen}
                onRequestClose={toggleModal}
                contentLabel="My dialog"
                className="modal"
                overlayClassName="myoverlay"
            >
                {modelComponents()}
            </Modal>
        </>
    );
}
