using UnityEngine;
using UnityEngine.SceneManagement;

public class WaitForOpponents : MonoBehaviour {

	void Start() {
        Server.AddListener(Server.MessageType.START_GAME, StartGame);
	}

    void StartGame(string[] args) {
        if (args.Length < 1) {
            Debug.LogWarning("Invalid Start message received, has no parameter. Ignoring start.");
            return;
        }
        int id = System.Convert.ToInt32(args[0]);
        PlayerManager.instance.SetSelfId(id);
        SceneManager.LoadScene(2);
    }
}
