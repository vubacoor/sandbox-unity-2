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

  const formatCharacterData = (characterInput, teamNo) => {
    const character = characterInput.character;
    const data = [
      ["Team: ", teamNo],
      ["Position: ", character.position],
    ];

    for (var property in character.baseStat) {
      data.push([property, character.baseStat[property]]);
    }
    return data;
  };

  const getEquipmentStats = (equipment) => {
    const stats = [];
    if (equipment["hp"]) {
      const value = getStatValue(equipment["hp"]);
      stats.push(["Equipment bonus hp", value]);
    }
    if (equipment["atk"]) {
      const value = getStatValue(equipment["atk"]);
      stats.push(["Equipment bonus atk", value]);
    }
    if (equipment["def"]) {
      const value = getStatValue(equipment["def"]);
      stats.push(["Equipment bonus def", value]);
    }
    if (equipment["luck"]) {
      const value = getStatValue(equipment["luck"]);
      stats.push(["Equipment bonus luck", value]);
    }
    if (equipment["crit"]) {
      const value = getStatValue(equipment["crit"]);
      stats.push(["Equipment bonus crit", value]);
    }
    if (equipment["speed"]) {
      const value = getStatValue(equipment["speed"]);
      stats.push(["Equipment bonus speed", value]);
    }
    return stats;
  };

  const getStatValue = (stat) => {
    if (stat["flat"]) {
      return stat["flat"];
    } else {
      return stat["percent"] + "%";
    }
  };

  const exportCSV = (stringData) => {
    const exportData = JSON.parse(stringData);
    let mergedData = [];
    exportData.battleInput.userCharacters.forEach((characterInput) => {
      const data = formatCharacterData(characterInput, 1);
      data.forEach((dataItem) => {
        mergedData.push(dataItem);
      });
      if (characterInput.equiments.length > 0) {
        mergedData.push(["Equipment: ", characterInput.equiments[0].key]);
        const stats = getEquipmentStats(characterInput.equiments[0]);
        mergedData = [...mergedData, ...stats];
      }
    });
    mergedData.push(["", ""]);
    exportData.battleInput.opponentCharacters.forEach((characterInput) => {
      const data = formatCharacterData(characterInput, 2);
      data.forEach((dataItem) => {
        mergedData.push(dataItem);
      });
    });

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
    const worksheet1 = XLSX.utils.json_to_sheet(mergedData);
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
        battleStatus = "Lost";
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
