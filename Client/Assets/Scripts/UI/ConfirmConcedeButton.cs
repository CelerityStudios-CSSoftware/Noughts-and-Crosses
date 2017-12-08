using UnityEngine;
using UnityEngine.UI;

[RequireComponent(typeof(Button))]
public class ConfirmConcedeButton : MonoBehaviour {
    private Button _buttonComponent;

    void Start() {
        _buttonComponent = GetComponent<Button>();
        _buttonComponent.onClick.AddListener(Clicked);
    }

    void Clicked() {
        Match.instance.Concede();
    }
}
