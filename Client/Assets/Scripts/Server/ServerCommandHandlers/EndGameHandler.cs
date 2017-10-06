using UnityEngine;


class EndGameHandler : MonoBehaviour {
    void Start() {
        Server.AddListener(Server.MessageType.END_GAME, EndGame);
    }

    void EndGame(string[] args) {
        Debug.Log("Parsing end game " + args);
        int winner;

        if (args.Length < 1) {
            Debug.LogWarning("Invalid End Game message received, has no parameter. Ignored.");
            return;
        }
        winner = System.Convert.ToInt32(args[0]);
        Match.instance.SetWinner(winner);
    }
}
