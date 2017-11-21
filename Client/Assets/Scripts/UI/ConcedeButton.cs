using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class ConcedeButton : MonoBehaviour {
    private Button _buttonComponent;

    void Start() {
        _buttonComponent = GetComponent<Button>();
        _buttonComponent.onClick.AddListener(Clicked);
    }

    void Clicked() {
        Server.instance.WriteToServer("c");
    }
}
