import React, { useState, useRef, useEffect } from "react";
import {
	View,
	Text,
	StyleSheet,
	Button,
	TextInput,
	SafeAreaView,
	ScrollView,
	Animated,
	TouchableOpacity,
	Image,
} from "react-native";

const TirePressureApp = () => {
	const [deviceIP, setDeviceIP] = useState("");
	const [selectedDevice, setSelectedDevice] = useState(null);
	const [wheelData, setWheelData] = useState({
		FL: { pressure: 0, temperature: 0 },
		FR: { pressure: 0, temperature: 0 },
		RL: { pressure: 0, temperature: 0 },
		RR: { pressure: 0, temperature: 0 },
	});
	const [pollingIntervalId, setPollingIntervalId] = useState(null);

	const connectToDevice = () => {
		if (!deviceIP) return;
		setSelectedDevice(deviceIP);
		// Start polling the ESP32 web server for tire data every 1 second
		const intervalId = setInterval(() => {
			fetch(`http://${deviceIP}/data`)
				.then((response) => response.json())
				.then((json) => {
					if (json.tireData) {
						setWheelData(json.tireData);
					}
				})
				.catch((error) =>
					console.error("Error fetching data from ESP32:", error)
				);
		}, 1000);
		setPollingIntervalId(intervalId);
	};

	const disconnectDevice = () => {
		if (pollingIntervalId) {
			clearInterval(pollingIntervalId);
			setPollingIntervalId(null);
		}
		setSelectedDevice(null);
	};

	// Function to send a command to the ESP32
	const sendCommand = (payload) => {
		if (!selectedDevice) return;
		fetch(`http://${selectedDevice}/command`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		})
			.then((response) => response.text())
			.then((text) => {
				console.log("Command response:", text);
			})
			.catch((error) => console.error("Error sending command:", error));
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* ScrollView lets the whole screen scroll vertically */}
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				{/* <Text style={styles.title}>Tire Pressure Monitoring</Text> */}
				{selectedDevice ? (
					//Actual Control GUI
					<View style={styles.dataContainer}>
						<View style={styles.tiresContainer}>
							<View style={styles.row}>
								<WheelInfo
									data={wheelData.FR}
									position="FR"
									onIncrease={() =>
										sendCommand({ wheel: "FR", command: "INCREASE" })
									}
									onDecrease={() =>
										sendCommand({ wheel: "FR", command: "DECREASE" })
									}
								/>
								<WheelInfo
									data={wheelData.RR}
									position="RR"
									onIncrease={() =>
										sendCommand({ wheel: "RR", command: "INCREASE" })
									}
									onDecrease={() =>
										sendCommand({ wheel: "RR", command: "DECREASE" })
									}
								/>
							</View>

							<View style={styles.row}>
								<WheelInfo
									data={wheelData.FL}
									position="FL"
									onIncrease={() =>
										sendCommand({ wheel: "FL", command: "INCREASE" })
									}
									onDecrease={() =>
										sendCommand({ wheel: "FL", command: "DECREASE" })
									}
								/>
								<WheelInfo
									data={wheelData.RL}
									position="RL"
									onIncrease={() =>
										sendCommand({ wheel: "RL", command: "INCREASE" })
									}
									onDecrease={() =>
										sendCommand({ wheel: "RL", command: "DECREASE" })
									}
								/>
							</View>
						</View>
						<Button title="Disconnect" onPress={disconnectDevice} />
					</View>
				) : (
					//Connecting to the ESP32
					<View style={styles.connectionContainer}>
						<Text style={styles.sectionTitle}>Enter ESP32 IP Address:</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g. 192.168.1.50"
							value={deviceIP}
							onChangeText={setDeviceIP}
							keyboardType="numeric"
						/>
						<Button title="Connect" onPress={connectToDevice} />
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const WheelInfo = ({ data, position, onIncrease, onDecrease }) => {
	const prevPressure = useRef(data.pressure);

	// 2. Animated value drives the flash
	const flashAnim = useRef(new Animated.Value(0)).current;

	// 3. Store which color to flash (green or red)
	const [flashColor, setFlashColor] = useState("green");

	useEffect(() => {
		// only run when pressure actually changes
		if (prevPressure.current !== data.pressure) {
			const isIncrease = data.pressure > prevPressure.current;
			setFlashColor(isIncrease ? "green" : "red");
			flashAnim.setValue(0);

			// flash from 0 → 1 → 0 over 600ms
			Animated.sequence([
				Animated.timing(flashAnim, {
					toValue: 1,
					duration: 100,
					useNativeDriver: false,
				}),
				Animated.timing(flashAnim, {
					toValue: 0,
					duration: 100,
					useNativeDriver: false,
				}),
			]).start();

			prevPressure.current = data.pressure;
		}
	}, [data.pressure, flashAnim]);

	// interpolate the Animated.Value into a text color
	const pressureColor = flashAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ["#000", flashColor],
	});

	return (
		<View style={styles.wheelContainer}>
			<View style={styles.infoContainer}>
				<Text style={styles.wheelData}>{position}</Text>
				<Animated.Text style={[styles.wheelData, { color: pressureColor }]}>
					{data.pressure.toFixed(2)} PSI
				</Animated.Text>
				<Text style={styles.wheelData}>
					{Number(data.temperature).toFixed(2)} °C
				</Text>
			</View>

			<View style={styles.buttonsContainer}>
				<TouchableOpacity onPress={onIncrease} style={styles.iconButton}>
					<Image
						source={require("./assets/arrow-up.png")}
						style={styles.icon}
					/>
				</TouchableOpacity>

				<TouchableOpacity onPress={onDecrease} style={styles.iconButton}>
					<Image
						source={require("./assets/arrow-down.png")}
						style={styles.icon}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#f5f5f5",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 5,
		textAlign: "center",
	},
	scrollContent: {
		padding: 20,
		flexGrow: 1,
	},
	dataContainer: {
		flex: 1,
	},
	connected: {
		fontSize: 16,
		color: "green",
		marginBottom: 20,
	},
	tiresContainer: {
		flex: 1,
		marginBottom: 20,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	wheelContainer: {
		backgroundColor: "white",
		padding: 15,
		borderRadius: 10,
		margin: 5,
		flex: 1,
		elevation: 3,
	},
	infoContainer: {
		flexDirection: "row",
		flex: 1,
	},
	wheelData: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 5,
		paddingLeft: 10,
		paddingRight: 10,
	},
	buttonsContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-evenly",
		marginTop: 5,
	},
	iconButton: {
		padding: 20, // give a larger tap area
		borderRadius: 6, // optional: round the hit‑area
		backgroundColor: "#eee", // optional: visible feedback background
	},
	icon: {
		width: 45,
		height: 45,
		resizeMode: "contain",
	},
	connectionContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 10,
	},
	input: {
		height: 40,
		width: "80%",
		borderColor: "gray",
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 20,
	},
});

export default TirePressureApp;
