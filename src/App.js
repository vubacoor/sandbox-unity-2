import { Unity, useUnityContext } from "react-unity-webgl";
import "./App.css";
import { useEffect } from "react";
import * as XLSX from "xlsx";

function App() {
  const { unityProvider, isLoaded, addEventListener, removeEventListener } =
    useUnityContext({
      productName: "BK Sandbox",
      productVersion: "1.0.0",
      companyName: "Bacoor",
      loaderUrl: `/unity/sb-new.loader.js`,
      dataUrl: `/unity/sb-new.data.unityweb`,
      frameworkUrl: "/unity/sb-new.framework.js.unityweb",
      codeUrl: `/unity/sb-new.wasm.unityweb`,
      webglContextAttributes: {
        preserveDrawingBuffer: true,
      },
    });

  useEffect(() => {
    if (isLoaded) {
      addEventListener("ExportCSV", exportCSV);
    }
    return () => {
      removeEventListener("ExportCSV", exportCSV);
    };
  }, [addEventListener, removeEventListener, isLoaded]);

  const formatCharacterData = (character, teamNo) => {
    return {
      ...character.baseStat,
      itemList: JSON.stringify(character.itemList),
      rarity: character.rarity,
      position: character.position,
      team: teamNo,
    };
  };

  const exportCSV = (stringData) => {
    const exportData = JSON.parse(stringData);
    const userCharacters = exportData.battleInput.userCharacters.map(
      (character) => formatCharacterData(character, 1)
    );
    const opponentCharacters = exportData.battleInput.opponentCharacters.map(
      (character) => formatCharacterData(character, 2)
    );

    // public List<int> winBattles;
    // public List<int> lostBattles;
    // public List<int> drawBattles;
    // public double winRate;

    const battleDatas = exportData.battleDatas;
    const totalWin = exportData.winBattles.length;
    const totalLoss = exportData.lostBattles.length;
    const totalDraws = exportData.drawBattles.length;
    const total = totalWin + totalLoss + totalDraws;
    const winRate = exportData.winRate;

    const workbook = XLSX.utils.book_new();
    const worksheet1 = XLSX.utils.json_to_sheet([
      ...userCharacters,
      ...opponentCharacters,
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet1, "Characters Info");

    const headers = [
      "TurnNo",
      "OrderNo",
      "Phase",
      "CasterId",
      "TargetId",
      "EffectId",
      "StatChangeTypes",
      "BeforeValue",
      "AfterValue",
    ];

    const worksheet2 = XLSX.utils.json_to_sheet([
      ["Total win", totalWin],
      [
        "Battle",
        JSON.stringify(exportData.winBattles).substring(1).replace("]", ""),
      ],
      ["", ""],
      ["Total loss", totalLoss],
      [
        "Battle",
        JSON.stringify(exportData.lostBattles).substring(1).replace("]", ""),
      ],
      ["", ""],
      ["Total draws", totalDraws],
      [
        "Battle",
        JSON.stringify(exportData.drawBattles).substring(1).replace("]", ""),
      ],
      ["", ""],
      ["Total", total],
      ["", ""],
      ["Win rate", winRate + "%"],
      ["", ""],
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet2, "Run Info ");
    battleDatas.forEach((battleOutput, i) => {
      let battleStatus;
      const battleNo = i + 1;
      if (exportData.winBattles.includes(battleNo)) {
        battleStatus = "Win";
      } else if (exportData.lostBattles.includes(battleNo)) {
        battleStatus = "Loose";
      } else {
        battleStatus = "Draw";
      }
      let excelData = [];
      battleOutput.forEach((columnDatas) => {
        let excelDataItem = {};
        columnDatas.forEach((data, i) => {
          excelDataItem[headers[i]] = data;
        });
        excelData.push(excelDataItem);
      });
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Battle " + (i + 1) + `(${battleStatus})`
      );
    });
    XLSX.writeFile(workbook, "Bk-Combat-Data.xlsx");
  };

  return (
    <div className="App">
      <div className="unity-wrapper" id="unity-wrapper">
        <Unity
          id="unity-canvas"
          className="unity-canvas"
          unityProvider={unityProvider}
        />
      </div>
    </div>
  );
}

export default App;
