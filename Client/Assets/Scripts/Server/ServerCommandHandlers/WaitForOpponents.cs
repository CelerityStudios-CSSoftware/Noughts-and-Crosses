using UnityEngine;
using UnityEngine.SceneManagement;

public class WaitForOpponents : MonoBehaviour {

    //TODO make sure that this is listening as soon as the server connection is made
	void Start() {
        Server.AddListener(Server.MessageType.START_GAME, StartGame);
        Server.instance.Unpause();
	}

    void StartGame(string[] args) {
        if (args.Length < 1) {
            Debug.LogWarning("Invalid Start message received, has no parameter. Ignoring start.");
            return;
        }
        int id = System.Convert.ToInt32(args[0]);
        PlayerManager.instance.SetSelfId(id);
        Server.instance.Pause();
        SceneManager.LoadScene(2);
    }
}
