using UnityEngine;

public class TurnHandler : MonoBehaviour {
    public PlayerCard currentTurn;

    void Start() {
        Server.AddListener(Server.MessageType.TURN, Turn);
    }

    void Turn(string[] args) {
        Debug.Log(("Parsing turn " + args));
        int playerID;

        if (args.Length < 1) {
            Debug.LogWarning("Invalid Turn message received, has no parameter. Ignoring turn.");
            return;
        }
        playerID = System.Convert.ToInt32(args[0]);
        Match.instance.currentTurnPlayerID = playerID;
        currentTurn.SetPlayer(PlayerManager.instance.GetPlayerFromId(playerID));
    }
}