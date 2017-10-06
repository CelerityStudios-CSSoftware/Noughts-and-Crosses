using UnityEngine;
using UnityEngine.UI;

// Apply this to a Text UI entity. It will update it to state how many
// opponents are still needed before the match can start.
[RequireComponent(typeof(Text))]
public class TrackOpponentsToFind : MonoBehaviour {
    private Text _textComponent;

    void Start() {
        _textComponent = GetComponent<Text>();
        Server.AddListener(Server.MessageType.MATCHMAKING, OpponentFound);
    }

    void OpponentFound(string[] args) {
        if (args.Length != 2) return;
        int playersFound;
        int playersNeeded;
        int opponentsToFind;
        if (!int.TryParse(args[0], out playersFound)) return;
        if (!int.TryParse(args[1], out playersNeeded)) return;
        if (PlayerManager.instance.PlayerAmount() == -1) {
            PlayerManager.instance.SetPlayerAmount(playersNeeded);
        }
        opponentsToFind = playersNeeded - playersFound;
        string playerLabel = "player" + (opponentsToFind == 1 ? "" : "s");
        _textComponent.text = "Finding " + opponentsToFind + " more " + playerLabel;
    }
}