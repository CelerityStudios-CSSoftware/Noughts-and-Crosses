using UnityEngine;
using UnityEngine.EventSystems;

public class ShowOrHideUIOnClick : MonoBehaviour, IPointerClickHandler {
    public GameObject UIToHide;
    public enum ShowOrHide {
        SHOW,
        HIDE
    };
    public ShowOrHide which;

    public void OnPointerClick(PointerEventData _) {
        UIToHide.SetActive(which == ShowOrHide.SHOW);
    }
}
