using UnityEngine;
using UnityEngine.UI;

public class TriggerEvent : MonoBehaviour {
    private Button _buttonComponent;
    public Server.MessageType messageType;
    public string[] messageArgs;

    void Start() {
        _buttonComponent = GetComponentInChildren<Button>();
        _buttonComponent.onClick.AddListener(Clicked);
    }

    void Clicked() {
        Server.TriggerEvent(messageType, messageArgs);
    }
}