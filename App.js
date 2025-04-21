import React, { useState } from "react";
import { View, Text, StyleSheet, Button, TextInput } from "react-native";

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
		<View style={styles.container}>
			<Text style={styles.title}>Tire Pressure Monitoring</Text>
			{selectedDevice ? (
				<View style={styles.dataContainer}>
					<Text style={styles.connected}>
						Connected to ESP32: {selectedDevice}
					</Text>
					<View style={styles.tiresContainer}>
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
								data={wheelData.FR}
								position="FR"
								onIncrease={() =>
									sendCommand({ wheel: "FR", command: "INCREASE" })
								}
								onDecrease={() =>
									sendCommand({ wheel: "FR", command: "DECREASE" })
								}
							/>
						</View>
						<View style={styles.row}>
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
					</View>
					<Button title="Disconnect" onPress={disconnectDevice} />
				</View>
			) : (
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
		</View>
	);
};

const WheelInfo = ({ data, position, onIncrease, onDecrease }) => (
	<View style={styles.wheelContainer}>
		<Text style={styles.wheelPosition}>{position}</Text>
		<Text style={styles.wheelData}>{Number(data.pressure).toFixed(2)} PSI</Text>
		<Text style={styles.wheelData}>
			{Number(data.temperature).toFixed(2)} °C
		</Text>
		<View style={styles.buttonsContainer}>
			<View style={styles.buttons}>
				<Button title="↑" onPress={onIncrease} />
			</View>
			<View style={styles.buttons}>
				<Button title="↓" onPress={onDecrease} />
			</View>
		</View>
	</View>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: "#f5f5f5",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 20,
		textAlign: "center",
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
		marginBottom: 20,
	},
	wheelContainer: {
		backgroundColor: "white",
		padding: 15,
		borderRadius: 10,
		width: "48%",
		elevation: 3,
	},
	wheelPosition: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 10,
	},
	wheelData: {
		fontSize: 16,
	},
	buttonsContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	buttons: {
		paddingLeft: 5,
		paddingRight: 5,
		flex: 1,
		paddingTop: 10,
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
