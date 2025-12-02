import React from "react";
import { render, screen } from "@testing-library/react";
import { RequirementDetail, NPIDetailType } from "../RequirementDetail";

describe("RequirementDetail", () => {
  describe("NPI Requirement", () => {
    const baseNPIDetail: NPIDetailType = {
      number: "1669437901",
      status: "Active",
      isNPI: true,
    };

    it("should render verified NPI correctly", () => {
      const verifiedNPI: NPIDetailType = {
        ...baseNPIDetail,
      };

      render(
        <RequirementDetail
          detail={verifiedNPI}
          requirementType="national_provider_identifier"
        />
      );

      expect(screen.getByText("Number")).toBeInTheDocument();
      expect(screen.getByText("1669437901")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show active status correctly", () => {
      const activeNPI: NPIDetailType = {
        ...baseNPIDetail,
        status: "Active",
      };

      render(
        <RequirementDetail
          detail={activeNPI}
          requirementType="national_provider_identifier"
        />
      );

      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("should show error state for inactive NPI", () => {
      const inactiveNPI: NPIDetailType = {
        ...baseNPIDetail,
        status: "Inactive",
      };

      render(
        <RequirementDetail
          detail={inactiveNPI}
          requirementType="national_provider_identifier"
        />
      );

      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });
  });
});
