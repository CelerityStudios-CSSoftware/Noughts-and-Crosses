using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

[RequireComponent(typeof(Button))]
public class PlayButton : MonoBehaviour {
    private Button _buttonComponent;
    public Text serverAddress;
    public Text serverPort;

    // Use this for initialization
	void Start() {
        _buttonComponent = GetComponent<Button>();
        _buttonComponent.onClick.AddListener(Clicked);
    }

	void Clicked() {
        string addr = serverAddress.text;
        int port;
        if (!int.TryParse(serverPort.text, out port)) {
            Debug.LogError("'" + serverPort.text + "' is not a valid port.");
            return;
        }
        Debug.Log(serverAddress.text);
        Debug.Log(serverPort.text);
        Server.Connect(addr, port);
        SceneManager.LoadScene(1);
    }
}
