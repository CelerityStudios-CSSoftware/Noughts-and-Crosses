using UnityEngine;

public class MoveHandler : MonoBehaviour {
    void Start() {
        Server.AddListener(Server.MessageType.MOVE, _ParseEnemyMove);
    }

    private void _ParseEnemyMove(string[] args) {
        Debug.Log("Parsing move " + args);
        uint x, y;

        if (args.Length < 2) {
            Debug.LogWarning("Invalid Move received, has less than 2 parameters. Move ignored.");
            return;
        }
        x = System.Convert.ToUInt32(args[0]);
        y = System.Convert.ToUInt32(args[1]);
        Match.instance.PlayMove(x, y);
    }
}
