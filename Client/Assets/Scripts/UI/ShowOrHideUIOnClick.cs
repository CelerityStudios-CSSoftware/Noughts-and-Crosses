using UnityEngine;
using UnityEngine.EventSystems;

public class ShowOrHideUIOnClick : MonoBehaviour, IPointerClickHandler {
    public GameObject UIToHide;
    public enum ShowOrHide {
        SHOW,
        HIDE,
        TOGGLE
    };
    public ShowOrHide which;

    public void OnPointerClick(PointerEventData _) {
        // If toggle, then set to active if inactive and the other way round
        // If not toggle then show means active and hide means inactive
        bool target = which == ShowOrHide.TOGGLE ? !UIToHide.activeSelf : which == ShowOrHide.SHOW;
        UIToHide.SetActive(target);
    }
}
