import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';

//import { API, Storage } from 'aws-amplify';

import JayButton from './JayButton';

// import ImagePicker from 'react-native-image-picker';
import { ImagePicker } from 'expo';
//import { RNS3 } from 'react-native-aws3';


export default class Test extends React.Component {
	state = {
		apiResponse: null,
		forumId: ''
	};

	handleChangeForumId = (event) => {
		console.log('handleChangeForumId: ' + event);
		this.setState({ forumId: event });
	}

	// CREATE: Create a new forum
	async saveForum() {
		let newForum = {
			body: {
				"ForumTitle": "My first forum!",
				"ForumContent": "This is so awesome!",
				"ForumId": this.state.forumId
			}
		}

		const path = "/Forums";

		// Use the API module to save the forum to the database
		try {
			const apiResponse = await API.put("ForumsCRUD", path, newForum); // put
			console.log("response from saving forum: " + apiResponse);
			this.setState({ apiResponse });
		} catch (e) {
			console.log(e);
		}
	}

	// READ: Get a specific forum (forumId is the primary key of the particular record you want to fetch
	async getForum() {
		const path = "/Forums/object/" + this.state.forumId;
		try {
			const apiResponse = await API.get("ForumsCRUD", path); // get
			console.log("response from getting forum: " + apiResponse);
			this.setState({ apiResponse });
		} catch (e) {
			console.log(e);
		}
	}

	// DELETE: delete a specific forum (forumId is the forumId of the particular record you want to delete)
	async deleteForum() {
		const path = "/Forums/object/" + this.state.forumId;
		try {
			const apiResponse = await API.del("ForumsCRUD", path); // del
			console.log("response from deleting forum: " + apiResponse);
			this.setState({ apiResponse });
		} catch (e) {
			console.log(e);
		}
	}

	//// ToDo ////

	// upload a file to storage
	async uploadFile() {
		let file = 'My upload text';
		let name = 'myFile.txt';
		const access = { level: "public" }; // note the access path
		Storage.put(name, file, access);
	}

	// download a file from cloud storage
	async getFile() {
		let name = 'myFile.txt';
		const access = { level: "public" };
		let fileUrl = await Storage.get(name, access);
		// use fileUrl to get the file
	}

	// async componentDidMount() {
	// 	const path = this.props.path;
	// 	const access = { level: "public" };
	// 	let files = await Storage.list(path, access);
	// 	// use file list to get single files

	// 	/*
	// 	file.Size; // file size
	// 	file.LastModified.toLocaleDateString(); // last modified date
	// 	file.LastModified.toLocaleTimeString(); // last modified time
	// 	*/
	// }

	// delete a file
	async deleteFile(key) {
		const access = { level: "public" };
		Storage.remove(key, access);
	}

	// test: 20181102
	async saveImage() {

		let result = await ImagePicker.launchImageLibraryAsync({
			// allowsEditing: true,
			// aspect: [4, 3],
			quality: 1.0
		});

		console.log(result);

		if (result.cancelled == false) {

			// 0: userfiles/public, text
			// --
			/*
			let file = '[TTT] My upload text';
			let name = '[TTT] myFile.txt';
			const access = { level: "public" }; // note the access path
			Storage.put(name, file, access).then( (response) => { console.log(response); });
			*/
			// --

			// 1: userfiles/public, image
			// --
			/*
			var uri = result.uri;
			let filename = uri.substring(uri.lastIndexOf('/') + 1);
			const access = { level: "public" }; // note the access path
			Storage.put(filename, uri, access).then( (response) => { console.log(response); });
			*/
			// --

			// 2: bucket
			// --
			var uri = result.uri;
			let filename = uri.substring(uri.lastIndexOf('/') + 1);
			let imageType = filename.substring(filename.lastIndexOf('.') + 1); // ToDo: image/jpg

			const file = {
				uri: result.uri,
				name: filename,
				type: 'image/' + imageType // image/gif, image/png, image/jpeg, image/bmp
			}

			console.log(file);

			const config = {
				keyPrefix: 'uploads/',
				bucket: 'boomboomclient',
				region: 'ap-southeast-1',
				accessKey: 'AKIAIYICPKABIG7JUOXQ', // accessKeyId
				secretKey: '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', // secretAccessKey
				successActionStatus: 201
			}

			RNS3.put(file, config).then( (response) => {
				console.log(response);

				if (response.status == 201) {
					console.log(response.body);
				}
			});
			// --
		}

	} // end of saveImage()






	render() {
		return (
			<View style={styles.container}>

				<View style={styles.header}><Text>header</Text></View>
				<View style={styles.title}><Text>title</Text></View>
				<View style={styles.content}><Text>content</Text>

					<JayButton text="Save Forum" onPress={this.saveForum.bind(this)} style={styles.button} />

					<JayButton text="Get Forum" onPress={this.getForum.bind(this)} />

					<JayButton text="Delete Forum" onPress={this.deleteForum.bind(this)} />

					<JayButton text="Upload Picture" onPress={this.saveImage.bind(this)} />

					<Text style={{ color: 'white' }}>ForumID: </Text>
					<TextInput style={styles.textInput} autoCapitalize='none' onChangeText={this.handleChangeForumId} />

					<Text style={{ color: 'white' }}>Response: {this.state.apiResponse && JSON.stringify(this.state.apiResponse)}</Text>

				</View>
				<View style={styles.footer}><Text>footer</Text></View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: 50,
		backgroundColor: 'black',
		flexDirection: 'column',
		alignItems: 'stretch',
		justifyContent: 'center'
	},

	header: {
		width: '100%',
		height: '10%',
		backgroundColor: '#ff9a9a',
		justifyContent: 'center',
		alignItems: 'center'
	},

	title: {
		width: '100%',
		height: '20%',
		backgroundColor: '#9aa9ff',
		justifyContent: 'center',
		alignItems: 'center'
	},

	content: {
		flex: 1,
		backgroundColor: '#d6ca1a',

		// justifyContent: 'center',
		alignItems: 'stretch',
		padding: 10
	},

	footer: {
		width: '100%',
		height: '10%',
		backgroundColor: '#1ad657',
		justifyContent: 'center',
		alignItems: 'center'
	},

	button: {
		marginBottom: 20
	},

	textInput: {
		// margin: 15,
		height: 30,
		// width: 200,
		borderWidth: 1,
		color: 'green',
		fontSize: 20,
		backgroundColor: 'yellow'
	}
});

