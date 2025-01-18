import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { createTicket } from "@/services/zendeskService";
import TicketForm from "../TicketForm";

// Mock dependencies
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/services/zendeskService", () => ({
  createTicket: jest.fn(),
}));

describe("TicketForm", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    role: "user",
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (createTicket as jest.Mock).mockResolvedValue({
      id: "test-ticket-id",
      status: "open",
    });
  });

  it("renders the form correctly", () => {
    render(<TicketForm />);

    expect(screen.getByLabelText("support.category")).toBeInTheDocument();
    expect(screen.getByLabelText("support.subject")).toBeInTheDocument();
    expect(screen.getByLabelText("support.description")).toBeInTheDocument();
    expect(screen.getByLabelText("support.priority")).toBeInTheDocument();
    expect(screen.getByText("support.uploadFiles")).toBeInTheDocument();
  });

  it("submits the form successfully", async () => {
    render(<TicketForm />);

    // Fill out the form
    await userEvent.selectOptions(
      screen.getByLabelText("support.category"),
      "technical"
    );
    await userEvent.type(
      screen.getByLabelText("support.subject"),
      "Test Subject"
    );
    await userEvent.type(
      screen.getByLabelText("support.description"),
      "Test Description"
    );
    await userEvent.selectOptions(
      screen.getByLabelText("support.priority"),
      "high"
    );

    // Submit the form
    await userEvent.click(
      screen.getByRole("button", { name: "support.submitTicket" })
    );

    // Verify createTicket was called with correct data
    await waitFor(() => {
      expect(createTicket).toHaveBeenCalledWith(
        {
          category: "technical",
          subject: "Test Subject",
          description: "Test Description",
          priority: "high",
        },
        mockUser
      );
    });

    // Verify success message is shown
    expect(screen.getByText("support.ticketCreated")).toBeInTheDocument();
  });

  it("displays error message on submission failure", async () => {
    const error = new Error("Failed to create ticket");
    (createTicket as jest.Mock).mockRejectedValue(error);

    render(<TicketForm />);

    // Fill out and submit the form
    await userEvent.selectOptions(
      screen.getByLabelText("support.category"),
      "technical"
    );
    await userEvent.type(
      screen.getByLabelText("support.subject"),
      "Test Subject"
    );
    await userEvent.type(
      screen.getByLabelText("support.description"),
      "Test Description"
    );
    await userEvent.click(
      screen.getByRole("button", { name: "support.submitTicket" })
    );

    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText("Failed to create ticket")).toBeInTheDocument();
    });
  });

  it("handles file attachments", async () => {
    render(<TicketForm />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = screen.getByLabelText("support.uploadFiles");

    await userEvent.upload(input, file);

    expect((input as HTMLInputElement).files?.[0]).toBe(file);
    expect((input as HTMLInputElement).files?.length).toBe(1);
  });
});
